"""Forward authenticated Trainer profile updates to the bot service."""

import hashlib
import hmac
import json
import os
import time

import httpx
from fastapi.responses import JSONResponse


async def update_own_trainer_values(request, field, *, frontend_url, bot_api_base):
    user = request.session.get("discord_user")
    if not user:
        return JSONResponse({"detail": "Authentication required"}, status_code=401)
    if not user.get("discord_role_checked") or user.get("discord_role") != "trainer":
        return JSONResponse({"detail": "Trainer role required"}, status_code=403)
    origin = request.headers.get("origin")
    if origin and origin.rstrip("/") != frontend_url.rstrip("/"):
        return JSONResponse({"detail": "Invalid origin"}, status_code=403)
    secret = os.getenv("APTITUDE_SYNC_SECRET", "")
    if not secret:
        return JSONResponse({"detail": "บริการเว็บยังไม่ได้ตั้งค่า APTITUDE_SYNC_SECRET"}, status_code=503)
    if not bot_api_base:
        return JSONResponse({"detail": "บริการเว็บยังไม่ได้ตั้งค่า BOT_API_BASE (URL ของบอต API)"}, status_code=503)
    try:
        values = await request.json()
    except ValueError:
        return JSONResponse({"detail": "Invalid JSON"}, status_code=400)
    body = json.dumps({"user_id": str(user["id"]), field: values}, separators=(",", ":")).encode()
    timestamp = str(int(time.time()))
    signature = hmac.new(secret.encode(), timestamp.encode() + b"." + body, hashlib.sha256).hexdigest()
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(
                f"{bot_api_base}/internal/trainer-{field}", content=body,
                headers={"content-type": "application/json", "x-aptitude-timestamp": timestamp, "x-aptitude-signature": signature},
            )
        return JSONResponse(response.json(), status_code=response.status_code)
    except (httpx.HTTPError, ValueError):
        return JSONResponse({"detail": "Cannot connect to the bot"}, status_code=502)
