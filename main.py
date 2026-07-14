import os
import requests
import httpx
import sqlite3
import time

from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import uvicorn
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2 import OperationalError
from urllib.parse import urlencode
load_dotenv()

app = FastAPI()

# --- 1. การตั้งค่า CORS ---
# เพิ่ม URL ของ Railway ของคุณลงใน list นี้เมื่อ deploy แล้ว
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # allow_origins=[
    #     "http://localhost:5173",
    #     "https://umaroleplaycommunity.up.railway.app",
    # ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

IS_RAILWAY = os.getenv("RAILWAY_ENVIRONMENT") is not None
MOUNT_PATH = "/app/data" if IS_RAILWAY else "."
DB_NAME = os.path.join(MOUNT_PATH, "uma_database.db") # เปลี่ยนชื่อไฟล์ให้ตรงกับใน Volume

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BOT_API_BASE = os.getenv("BOT_API_BASE", "").rstrip("/")

DATABASE_URL = os.getenv("DATABASE_URL")


def get_sqlite_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def get_postgres_candidates():
    candidates = []
    for env_name in [
        "DATABASE_URL",
        "DATABASE_PUBLIC_URL",
        "POSTGRES_URL",
        "POSTGRES_PUBLIC_URL",
        "PGDATABASE_URL",
    ]:
        value = os.getenv(env_name)
        if value and value not in candidates:
            candidates.append(value)
    return candidates


def get_db_connection():
    if os.path.exists(DB_NAME):
        return get_sqlite_connection()

    errors = []

    for candidate in get_postgres_candidates():
        try:
            return psycopg2.connect(candidate, cursor_factory=RealDictCursor)
        except OperationalError as exc:
            errors.append(f"{candidate.split('@')[-1]} -> {exc}")

    if errors:
        raise RuntimeError(" | ".join(errors))
    raise RuntimeError("No database connection configured")


def close_db_connection(conn):
    if conn:
        conn.close()


def fetch_all(cur):
    rows = cur.fetchall()
    return [dict(row) for row in rows]


def fetch_one(cur):
    row = cur.fetchone()
    return dict(row) if row else None


def get_table_columns(cur, table_name: str):
    connection_module = type(cur.connection).__module__
    if connection_module.startswith("sqlite3"):
        cur.execute(f"PRAGMA table_info({table_name})")
        return {row["name"] for row in fetch_all(cur)}

    cur.execute(
        """
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = %s
        """,
        (table_name,),
    )
    return {row["column_name"] for row in fetch_all(cur)}


def build_player_summary_query(columns):
    def first_available(candidates, default="NULL"):
        for column in candidates:
            if column in columns:
                return column
        return default

    def non_empty(column):
        return f"NULLIF(BTRIM(CAST({column} AS text)), '')"

    user_id_column = first_available(["user_id", "discord_id", "id"])
    username_column = first_available(["username", "name", "display_name"])
    type_column = first_available(["character_type", "player_type", "role"])

    image_candidates = [
        column
        for column in ["profile_image_url", "avatar_url", "avatar", "thumbnail", "thumnail", "image_url"]
        if column in columns
    ]

    select_parts = [
        f"{non_empty(user_id_column)} AS user_id" if user_id_column != "NULL" else "NULL AS user_id",
        f"{non_empty(username_column)} AS username" if username_column != "NULL" else "NULL AS username",
        (
            "COALESCE(" + ", ".join(non_empty(column) for column in image_candidates) + ") AS image_url"
            if image_candidates
            else "NULL AS image_url"
        ),
        (
            f"COALESCE({non_empty(type_column)}, 'Player') AS type"
            if type_column != "NULL"
            else "'Player' AS type"
        ),
    ]

    order_column = username_column if username_column != "NULL" else user_id_column
    order_sql = order_column if order_column != "NULL" else "1"

    return f"""
        SELECT {", ".join(select_parts)}
        FROM players
        ORDER BY {order_sql}
    """


def build_player_summary_item(row):
    username = str(row.get("username") or "").strip()
    user_id = str(row.get("user_id") or "").strip()
    if not username and not user_id:
        return None

    return {
        "id": user_id or username,
        "name": username or f"Player {user_id}",
        "image_url": row.get("image_url") or "",
        "type": str(row.get("type") or "Player").strip() or "Player",
    }


def get_player_summary_rows(cur):
    columns = get_table_columns(cur, "players")
    cur.execute(build_player_summary_query(columns))
    return fetch_all(cur)


@app.get("/login")
def login():
    auth_url = f"https://discord.com/api/oauth2/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=identify"
    return RedirectResponse(auth_url)

@app.get("/callback")
async def callback(code: str):
    data = {
        'client_id': CLIENT_ID, 'client_secret': CLIENT_SECRET,
        'grant_type': 'authorization_code', 'code': code, 'redirect_uri': REDIRECT_URI
    }
    response = requests.post("https://discord.com/api/oauth2/token", data=data)
    access_token = response.json().get("access_token")

    user_response = requests.get("https://discord.com/api/users/@me", headers={
        'Authorization': f'Bearer {access_token}'
    })
    user_data = user_response.json()
    # Give each Discord return URL a unique cache key so the browser always
    # loads the current SPA bundle after login rather than a cached dashboard.
    params = urlencode({
        "username": user_data["username"],
        "id": user_data["id"],
        "avatar": user_data.get("avatar") or "",
        "login_nonce": str(time.time_ns()),
    })
    target_url = f"{FRONTEND_URL.rstrip('/')}/dashboard?{params}"
    return RedirectResponse(target_url)

@app.get("/api/bot-stats/")
def get_bot_stats():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) as total_players FROM players")
        row = fetch_one(cur)
        return {"total_players": row["total_players"] if row else 0}
    except Exception as e:
        return {"error": str(e)}
    finally:
        if cur:
            cur.close()
        close_db_connection(conn)


@app.get("/api/players/summary")
def get_players_summary():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        rows = get_player_summary_rows(cur)
        players = [player for row in rows if (player := build_player_summary_item(row))]
        return {"players": players}
    except Exception as e:
        return JSONResponse({"detail": str(e)}, status_code=500)
    finally:
        if cur:
            cur.close()
        close_db_connection(conn)


@app.get("/api/players/{user_id}/summary")
def get_player_summary(user_id: str):
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        rows = get_player_summary_rows(cur)
        target_user_id = str(user_id).strip()

        for row in rows:
            player = build_player_summary_item(row)
            if player and str(player["id"]) == target_user_id:
                return player

        return JSONResponse({"detail": "Player not found"}, status_code=404)
    except Exception as e:
        return JSONResponse({"detail": str(e)}, status_code=500)
    finally:
        if cur:
            cur.close()
        close_db_connection(conn)


# The OAuth token exchange must use the exact same URI used to start OAuth.
# Keep it environment-specific so Test does not exchange with the Production URI.
MOBILE_REDIRECT_URI = f"{FRONTEND_URL.rstrip('/')}/callback/mobile"

async def exchange_discord_code_and_get_user(code: str, redirect_uri: str):
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://discord.com/api/oauth2/token",
            data={
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
            },
            headers={
                "Content-Type": "application/x-www-form-urlencoded"
            },
        )

        token_res.raise_for_status()
        token_data = token_res.json()

        access_token = token_data["access_token"]

        user_res = await client.get(
            "https://discord.com/api/users/@me",
            headers={
                "Authorization": f"Bearer {access_token}"
            },
        )

        user_res.raise_for_status()
        return user_res.json()


@app.get("/callback/mobile")
async def discord_mobile_callback(code: str):
    user = await exchange_discord_code_and_get_user(
        code,
        redirect_uri=MOBILE_REDIRECT_URI,
    )
    params = urlencode({
        "username": user["username"],
        "id": user["id"],
        "avatar": user.get("avatar") or "",
        "login_nonce": str(time.time_ns()),
    })

    return RedirectResponse(f"umadnd://callback?{params}")

# --- 4. Serve Frontend (เฉพาะเมื่อ Deploy ขึ้น Railway) ---

# ต้องวางไว้หลัง API เสมอเพื่อไม่ให้ขวางทาง Route อื่น
FRONTEND_DIST = "dist" if os.path.exists("dist") else os.path.join("uma-dashboard-ui", "dist")

if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")
    if os.path.exists(os.path.join(FRONTEND_DIST, "tcg")):
        app.mount("/tcg", StaticFiles(directory=os.path.join(FRONTEND_DIST, "tcg")), name="tcg-assets")
    if os.path.exists(os.path.join(FRONTEND_DIST, "mobs")):
        app.mount("/mobs", StaticFiles(directory=os.path.join(FRONTEND_DIST, "mobs")), name="mob-assets")
    if os.path.exists(os.path.join(FRONTEND_DIST, "race_bg")):
        app.mount("/race_bg", StaticFiles(directory=os.path.join(FRONTEND_DIST, "race_bg")), name="race-bg-assets")
    if os.path.exists(os.path.join(FRONTEND_DIST, "race_ranking")):
        app.mount("/race_ranking", StaticFiles(directory=os.path.join(FRONTEND_DIST, "race_ranking")), name="race-ranking-assets")
    if os.path.exists(os.path.join(FRONTEND_DIST, "role_selection_banner")):
        app.mount(
            "/role_selection_banner",
            StaticFiles(directory=os.path.join(FRONTEND_DIST, "role_selection_banner")),
            name="role-selection-banners",
        )
    if os.path.exists(os.path.join(FRONTEND_DIST, "music")):
        app.mount("/music", StaticFiles(directory=os.path.join(FRONTEND_DIST, "music")), name="music-assets")

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        # รายการ path ที่เป็น API/Auth ไม่ต้องส่งไฟล์ index.html
        if full_path.startswith("api") or full_path in ["login", "callback"]:
            return JSONResponse({"error": "Not Found"}, status_code=404)
        return FileResponse(
            os.path.join(FRONTEND_DIST, "index.html"),
            headers={"Cache-Control": "no-store, max-age=0", "Pragma": "no-cache"},
        )

if __name__ == "__main__":

    # Railway จะส่งค่า PORT มาให้ผ่าน Environment Variable
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
