import asyncio
import importlib.util
import os
from pathlib import Path

import pytest
from fastapi import HTTPException


ROOT = Path(__file__).resolve().parents[1]
SERVER_PATH = ROOT / "server.py"


def load_server(monkeypatch):
    monkeypatch.setenv("MONGO_URL", "mongodb://127.0.0.1:27017")
    monkeypatch.setenv("DB_NAME", "knook_preview_test")
    monkeypatch.setenv("JWT_SECRET", "unit-test-secret")
    monkeypatch.setenv("DEMO_MODE", "true")
    monkeypatch.setenv("DEMO_OTP_CODE", "123456")
    spec = importlib.util.spec_from_file_location("knook_preview_server_unit", SERVER_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class FakeUsers:
    def __init__(self, docs=None):
        self.docs = list(docs or [])

    async def find_one(self, query, _projection=None):
        for doc in self.docs:
            if all(doc.get(key) == value for key, value in query.items()):
                return dict(doc)
        return None

    async def update_one(self, query, update):
        for doc in self.docs:
            if all(doc.get(key) == value for key, value in query.items()):
                doc.update(update.get("$set", {}))
                return

    async def insert_one(self, doc):
        self.docs.append(dict(doc))


class FakeDb:
    def __init__(self, users):
        self.users = users


def test_firebase_mapping_attaches_to_existing_phone_hash(monkeypatch):
    server = load_server(monkeypatch)
    phone = "+15555550100"
    existing = {
        "uid": "demo-user-a",
        "phoneHash": server.sha256(server.normalize_phone(phone)),
        "phoneLast4": "0100",
        "onboardingCompleted": True,
    }
    users = FakeUsers([existing])
    monkeypatch.setattr(server, "db", FakeDb(users))

    resolved = asyncio.run(server.resolve_firebase_user({
        "uid": "firebase-alex",
        "phone_number": phone,
    }))

    assert resolved["uid"] == "demo-user-a"
    assert resolved["firebase_uid"] == "firebase-alex"
    assert len(users.docs) == 1


def test_firebase_mapping_bootstraps_new_preview_user(monkeypatch):
    server = load_server(monkeypatch)
    users = FakeUsers([])
    monkeypatch.setattr(server, "db", FakeDb(users))

    resolved = asyncio.run(server.resolve_firebase_user({
        "uid": "firebase-new-user",
        "phone_number": "+15555559999",
    }))

    assert resolved["uid"] == "firebase-new-user"
    assert resolved["firebase_uid"] == "firebase-new-user"
    assert resolved["phoneLast4"] == "9999"
    assert resolved["onboardingCompleted"] is False
    assert "phone" not in resolved
    assert len(users.docs) == 1


def test_firebase_mapping_requires_phone_claim(monkeypatch):
    server = load_server(monkeypatch)

    with pytest.raises(HTTPException) as exc:
        asyncio.run(server.resolve_firebase_user({"uid": "firebase-no-phone"}))

    assert exc.value.status_code == 401


def test_preview_mode_rejects_non_preview_token(monkeypatch):
    server = load_server(monkeypatch)
    monkeypatch.setattr(server, "AUTH_MODE", "preview")

    with pytest.raises(HTTPException) as exc:
        asyncio.run(server.current_user("Bearer firebase-looking-token"))

    assert exc.value.status_code == 401


def test_firebase_mode_uses_verified_claims(monkeypatch):
    server = load_server(monkeypatch)
    monkeypatch.setattr(server, "AUTH_MODE", "firebase")
    users = FakeUsers([])
    monkeypatch.setattr(server, "db", FakeDb(users))
    monkeypatch.setattr(server, "verify_firebase_token", lambda token: {
        "uid": "firebase-jordan",
        "phone_number": "+15555550101",
    })

    resolved = asyncio.run(server.current_user("Bearer verified-token"))

    assert resolved["uid"] == "firebase-jordan"
    assert resolved["firebase_uid"] == "firebase-jordan"
