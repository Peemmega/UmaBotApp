import os
from fastapi import FastAPI, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware # เพิ่มตัวนี้
import requests
from dotenv import load_dotenv
import sqlite3
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

load_dotenv()
app = FastAPI()
app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

@app.get("/{full_path:path}")
async def serve_react(full_path: str):
    # ถ้าไม่ใช่ API ให้ส่งหน้า index.html ของ React กลับไป
    if full_path.startswith("api") or full_path == "login" or full_path == "callback":
        pass 
    else:
        return FileResponse("dist/index.html")
    
# --- สำคัญมาก: อนุญาตให้ React (พอร์ต 5173) คุยกับ Python ได้ ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI")

@app.get("/login")
def login():
    auth_url = f"https://discord.com/api/oauth2/authorize?client_id={CLIENT_ID}&redirect_uri={REDIRECT_URI}&response_type=code&scope=identify"
    return RedirectResponse(auth_url)

@app.get("/callback")
def callback(code: str):
    # 1. แลก Token
    data = {
        'client_id': CLIENT_ID, 'client_secret': CLIENT_SECRET,
        'grant_type': 'authorization_code', 'code': code, 'redirect_uri': REDIRECT_URI
    }
    response = requests.post("https://discord.com/api/oauth2/token", data=data)
    access_token = response.json().get("access_token")

    # 2. ดึงข้อมูล User
    user_response = requests.get("https://discord.com/api/users/@me", headers={
        'Authorization': f'Bearer {access_token}'
    })
    user_data = user_response.json()

    # 3. ส่งข้อมูลกลับไปที่หน้า Dashboard ของ React (เปลี่ยน URL ตามหน้า React ของคุณ)
    # เราจะส่งข้อมูลผ่าน URL Parameter เพื่อให้ React รับไปใช้
    target_url = f"http://localhost:5173/dashboard?username={user_data['username']}&id={user_data['id']}&avatar={user_data['avatar']}"
    return RedirectResponse(target_url)

# ดึง URL จาก Environment Variable ของ Railway
DATABASE_URL = os.getenv("DATABASE_URL")

def check_tables(db_file):
    conn = sqlite3.connect(db_file)
    cur = conn.cursor()
    # ดึงรายชื่อตารางทั้งหมดในไฟล์
    cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cur.fetchall()
    print("ตารางที่มีใน Database:", tables)
    conn.close()

# เรียกใช้โดยใส่ชื่อไฟล์ที่คุณเจอ
# check_tables("ชื่อไฟล์ที่คุณเจอ.db")

DB_NAME = "uma_database.db"
@app.get("/api/bot-stats")
def get_bot_stats():
    # ตรวจสอบก่อนว่ามีไฟล์ database อยู่จริงไหม
    if not os.path.exists(DB_NAME):
        return {"error": f"ไม่พบไฟล์ {DB_NAME} ในโฟลเดอร์โปรเจกต์"}

    try:
        # เชื่อมต่อกับ SQLite
        conn = sqlite3.connect(DB_NAME)
        # ตั้งค่าให้ return ข้อมูลเป็น Dictionary เพื่อให้ React ใช้งานง่าย
        conn.row_factory = sqlite3.Row 
        cur = conn.cursor()
        
        # ลองดึงข้อมูลจากตาราง (สมมติว่าชื่อตารางคือ characters หรือ users)
        # แก้ไขชื่อ Table ตามโครงสร้างบอทของคุณได้เลย
        cur.execute("SELECT COUNT(*) as total_players FROM users") 
        row = cur.fetchone()
        
        total = row["total_players"] if row else 0
        
        cur.close()
        conn.close()
        
        return {"total_players": total}
    except Exception as e:
        return {"error": str(e)}



if __name__ == "__main__":
    import uvicorn
    # รันบนพอร์ต 8000 เพื่อให้ React (พอร์ต 5173) มาเรียกใช้ได้
    uvicorn.run(app, host="127.0.0.1", port=8000)