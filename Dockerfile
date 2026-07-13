# 1. Build React Frontend
FROM node:20 AS frontend-build
WORKDIR /app/frontend

# Railway exposes service variables to Docker builds only when they are
# declared as ARG. Vite replaces VITE_* values while building the bundle.
ARG VITE_APP_BASE_URL
ARG VITE_BOT_API_BASE
ARG VITE_RACE_API_BASE
ARG VITE_TCG_API_BASE
ENV VITE_APP_BASE_URL=$VITE_APP_BASE_URL
ENV VITE_BOT_API_BASE=$VITE_BOT_API_BASE
ENV VITE_RACE_API_BASE=$VITE_RACE_API_BASE
ENV VITE_TCG_API_BASE=$VITE_TCG_API_BASE

COPY uma-dashboard-ui/package*.json ./

# ใช้ npm ci ถ้ามี package-lock.json
RUN npm install

COPY uma-dashboard-ui/ ./
RUN npm run build


# 2. Run Python Backend
FROM python:3.11-slim
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY main.py .
COPY --from=frontend-build /app/frontend/dist ./dist

EXPOSE 8080

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1"]
