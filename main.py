import os
import requests
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import uvicorn
import os
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()

app = FastAPI()

# --- 1. การตั้งค่า CORS ---
# เพิ่ม URL ของ Railway ของคุณลงใน list นี้เมื่อ deploy แล้ว
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://umabotapp-production-c99a.up.railway.app",
    ],
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

DATABASE_URL = os.getenv("DATABASE_URL")
def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


@app.get("/login")
def login():
    auth_url = f"https://discord.com/api/oauth2/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=identify"
    return RedirectResponse(auth_url)

@app.get("/callback")
def callback(code: str):
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

    # ส่งกลับไปที่หน้า Dashboard ของ React
    target_url = f"{FRONTEND_URL}/dashboard?username={user_data['username']}&id={user_data['id']}&avatar={user_data['avatar']}"
    return RedirectResponse(target_url)

@app.get("/api/bot-stats")
def get_bot_stats():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) as total_players FROM players")
        row = cur.fetchone()
        cur.close()
        conn.close()
        return {"total_players": row["total_players"] if row else 0}
    except Exception as e:
        return {"error": str(e)}

# --- 4. Serve Frontend (เฉพาะเมื่อ Deploy ขึ้น Railway) ---

# ต้องวางไว้หลัง API เสมอเพื่อไม่ให้ขวางทาง Route อื่น
if os.path.exists("dist"):
    app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_react(full_path: str):
        # รายการ path ที่เป็น API/Auth ไม่ต้องส่งไฟล์ index.html
        if full_path.startswith("api") or full_path in ["login", "callback"]:
            return JSONResponse({"error": "Not Found"}, status_code=404)
        return FileResponse("dist/index.html")

if __name__ == "__main__":

    # Railway จะส่งค่า PORT มาให้ผ่าน Environment Variable
    port = int(os.getenv("PORT", 8080))
    uvicorn.run(app, host="0.0.0.0", port=port)
