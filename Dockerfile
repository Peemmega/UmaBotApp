# 1. Build React Frontend
FROM node:18 AS frontend-build
WORKDIR /app/frontend

# ก๊อปปี้ package files ก่อนเพื่อใช้ประโยชน์จาก Docker Cache
COPY uma-dashboard-ui/package*.json ./
RUN npm install

# ก๊อปปี้โค้ดทั้งหมดของ React
COPY uma-dashboard-ui/ ./

# สั่ง Build จริง (ห้ามใส่ || true เพื่อให้เราเห็น Error ถ้ามันพัง)
# ถ้าพังตรงนี้ ให้เช็คชื่อโฟลเดอร์ใน GitHub ว่าสะกด uma-dashboard-ui ตรงเป๊ะไหม
RUN npm run build

# 2. Run Python Backend
FROM python:3.11-slim
WORKDIR /app

# ติดตั้ง dependencies ของ Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ก๊อปปี้ไฟล์หลัก
COPY main.py .

# ก๊อปปี้โฟลเดอร์ dist ที่ Build เสร็จจาก Stage แรกมาไว้ที่ /app/dist
COPY --from=frontend-build /app/frontend/dist ./dist

# กำหนด Port ให้ยืดหยุ่นตามที่ Railway ต้องการ
ENV PORT=8080

# สั่งรัน uvicorn โดยดึงค่า Port จาก Environment Variable
CMD ["sh", "-c", "uvicorn main.py:app --host 0.0.0.0 --port ${PORT}"]