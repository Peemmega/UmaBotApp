import hashlib
import hmac
import json
import os
import unittest
from unittest.mock import patch

from services import trainer_profile_sync


class FakeRequest:
    def __init__(self, user, values, origin="https://dashboard.example"):
        self.session = {"discord_user": user} if user else {}
        self.headers = {"origin": origin}
        self.values = values

    async def json(self):
        return self.values


class TrainerStatsProxyTests(unittest.IsolatedAsyncioTestCase):
    async def test_trainer_request_uses_session_id_and_signed_payload(self):
        calls = []

        class Client:
            def __init__(self, **_kwargs):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *_args):
                pass

            async def post(self, url, *, content, headers):
                calls.append((url, content, headers))
                class Response:
                    status_code = 200
                    def json(self):
                        return {"player": {"speed": 8}}
                return Response()

        user = {"id": "123", "discord_role_checked": True, "discord_role": "trainer"}
        stats = {key: 8 for key in ("speed", "stamina", "power", "gut", "wit")}
        with patch.dict(os.environ, {"APTITUDE_SYNC_SECRET": "test-secret"}), patch.object(trainer_profile_sync.httpx, "AsyncClient", Client):
            response = await trainer_profile_sync.update_own_trainer_values(FakeRequest(user, stats), "stats", frontend_url="https://dashboard.example", bot_api_base="https://bot.example")
            aptitude_response = await trainer_profile_sync.update_own_trainer_values(FakeRequest(user, {"turf": 1}), "aptitudes", frontend_url="https://dashboard.example", bot_api_base="https://bot.example")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(aptitude_response.status_code, 200)
        url, body, headers = calls[0]
        self.assertEqual(url, "https://bot.example/internal/trainer-stats")
        self.assertEqual(json.loads(body), {"user_id": "123", "stats": stats})
        expected = hmac.new(b"test-secret", headers["x-aptitude-timestamp"].encode() + b"." + body, hashlib.sha256).hexdigest()
        self.assertEqual(headers["x-aptitude-signature"], expected)
        self.assertEqual(calls[1][0], "https://bot.example/internal/trainer-aptitudes")
        self.assertEqual(json.loads(calls[1][1]), {"user_id": "123", "aptitudes": {"turf": 1}})

    async def test_requires_authenticated_trainer_and_matching_origin(self):
        trainer = {"id": "123", "discord_role_checked": True, "discord_role": "trainer"}
        trainee = {"id": "124", "discord_role_checked": True, "discord_role": "trainee"}
        async def send(user, origin="https://dashboard.example"):
            return await trainer_profile_sync.update_own_trainer_values(FakeRequest(user, {}, origin=origin), "stats", frontend_url="https://dashboard.example", bot_api_base="https://bot.example")
        self.assertEqual((await send(None)).status_code, 401)
        self.assertEqual((await send(trainee)).status_code, 403)
        self.assertEqual((await send(trainer, "https://other.example")).status_code, 403)


if __name__ == "__main__":
    unittest.main()
