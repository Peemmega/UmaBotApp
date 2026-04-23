# 1. Build React Frontend
FROM node:18 AS frontend-build
WORKDIR /app/frontend
COPY uma-dashboard-ui/package*.json ./
RUN npm install
COPY uma-dashboard-ui/ ./
RUN npm run build

# 2. Run Python Backend
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ก๊อปปี้ไฟล์จาก Backend
COPY main.py .
# COPY .env . 

# ก๊อปปี้ไฟล์ที่ Build เสร็จแล้วจาก React มาไว้ที่โฟลเดอร์ dist
COPY --from=frontend-build /app/frontend/dist ./dist

# สั่งรัน FastAPI
CMD ["uvicorn", "main.py:app", "--host", "0.0.0.0", "--port", "8080"]