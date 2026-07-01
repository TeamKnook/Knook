"""Knook backend adapter.

This MVP runs Firebase-shaped APIs against MongoDB so the preview environment
can demo end-to-end flows. The real Knook stack uses Firestore + Cloud
Functions; everything here is intentionally thin so it can be swapped behind
the FirestoreService on the client.
"""
from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError
import jwt
import os
import logging
import uuid
import hashlib
import re
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=2000)
db = client[os.environ["DB_NAME"]]
DEMO_MODE = os.environ.get("DEMO_MODE", "false").lower() == "true"
DEMO_OTP_CODE = os.environ.get("DEMO_OTP_CODE")
JWT_SECRET = os.environ.get("JWT_SECRET")
JWT_ALGORITHM = "HS256"
JWT_TTL_HOURS = 12
TWO_USER_DEMO_PHONES = {
    "USER_A": "+15555550100",
    "USER_B": "+15555550101",
}

app = FastAPI(title="Knook MVP backend")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("knook")


# ---------- helpers ----------
def now() -> datetime:
    return datetime.now(timezone.utc)


def iso(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt else None


def normalize_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw or "")
    # naive E.164-ish: keep leading + if present, strip everything else
    if raw and raw.strip().startswith("+"):
        return "+" + digits
    return digits


def sha256(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


TWO_USER_DEMO_HASHES = {
    sha256(normalize_phone(phone)): alias
    for alias, phone in TWO_USER_DEMO_PHONES.items()
}


def demo_alias_for_user(user: Optional[dict]) -> str:
    if not user:
        return "UNKNOWN"
    return TWO_USER_DEMO_HASHES.get(user.get("phoneHash"), "USER")


def demo_alias_for_phone_hash(phone_hash: Optional[str]) -> str:
    return TWO_USER_DEMO_HASHES.get(phone_hash or "", "UNKNOWN")


def log_demo_event(prefix: str, message: str, **fields) -> None:
    safe_fields = " ".join(f"{key}={value}" for key, value in fields.items() if value is not None)
    logger.info("%s %s%s", prefix, message, f" {safe_fields}" if safe_fields else "")


def require_demo_mode() -> None:
    if not DEMO_MODE:
        raise HTTPException(403, "preview authentication is disabled")


def configured_demo_otp() -> str:
    require_demo_mode()
    if not DEMO_OTP_CODE:
        raise HTTPException(500, "DEMO_OTP_CODE is not configured")
    return DEMO_OTP_CODE


def configured_jwt_secret() -> str:
    if not JWT_SECRET or JWT_SECRET == "replace-with-local-secret":
        raise HTTPException(500, "JWT_SECRET must be configured for local preview auth")
    return JWT_SECRET


def create_session_token(uid: str) -> str:
    issued_at = now()
    payload = {
        "sub": uid,
        "typ": "knook-preview-session",
        "iat": issued_at,
        "exp": issued_at + timedelta(hours=JWT_TTL_HOURS),
    }
    return jwt.encode(payload, configured_jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_session_token(token: str) -> str:
    try:
        payload = jwt.decode(token, configured_jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "invalid token")
    if payload.get("typ") != "knook-preview-session" or not payload.get("sub"):
        raise HTTPException(401, "invalid token")
    return str(payload["sub"])


async def current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "missing bearer token")
    uid = decode_session_token(authorization.split(" ", 1)[1].strip())
    user = await db.users.find_one({"uid": uid}, {"_id": 0})
    if not user:
        raise HTTPException(401, "invalid token")
    return user


# ---------- models ----------
class RequestOtpIn(BaseModel):
    phone: str


class RequestOtpOut(BaseModel):
    verificationId: str
    devCode: str  # only because OTP is mocked for preview


class VerifyOtpIn(BaseModel):
    phone: str
    verificationId: str
    code: str


class AuthOut(BaseModel):
    token: str
    uid: str
    onboardingCompleted: bool


class ProfileIn(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    interestedIn: Optional[List[str]] = None
    dateVibe: Optional[str] = None
    loveLanguage: Optional[str] = None
    dealBreakers: Optional[List[str]] = None
    icebreaker: Optional[str] = None
    icebreakerAnswer: Optional[str] = None
    firstDatePrefs: Optional[List[str]] = None
    onboardingCompleted: Optional[bool] = None


class CrushIn(BaseModel):
    phone: str
    contactLabel: Optional[str] = None  # NEVER stored, only used for client display fallback


class MessageIn(BaseModel):
    text: str


# ---------- collections ----------
# users:        {uid, phoneHash, phoneLast4, name, ...}
# crushes:      {uid, phoneHash, status, crushedAt, expiresAt, matchId}
#               compound key (uid, phoneHash)
# matches:      {matchId, userA, userB, participants:[..], status, matchedAt,
#                revealedAt, matchExpiresAt, revealedBy:[..], mutualReveal,
#                lastMessageAt, lastMessagePreview}
# messages:     {messageId, matchId, senderId, type, text, sentAt, readBy}
# verifications: {verificationId, phone, code, createdAt}


# ---------- auth (mocked phone OTP) ----------
@api.post("/auth/request-otp", response_model=RequestOtpOut)
async def request_otp(body: RequestOtpIn):
    require_demo_mode()
    phone = normalize_phone(body.phone)
    if len(re.sub(r"\D", "", phone)) < 8:
        raise HTTPException(400, "invalid phone")
    verification_id = str(uuid.uuid4())
    code = configured_demo_otp()
    await db.verifications.insert_one({
        "verificationId": verification_id,
        "phone": phone,
        "code": code,
        "createdAt": now(),
    })
    return RequestOtpOut(verificationId=verification_id, devCode=code)


@api.post("/auth/verify-otp", response_model=AuthOut)
async def verify_otp(body: VerifyOtpIn):
    require_demo_mode()
    phone = normalize_phone(body.phone)
    record = await db.verifications.find_one(
        {"verificationId": body.verificationId}, {"_id": 0}
    )
    if not record:
        raise HTTPException(400, "unknown verification")
    if body.code != record["code"]:
        raise HTTPException(400, "invalid code")

    phone_hash = sha256(phone)
    phone_last4 = re.sub(r"\D", "", phone)[-4:]
    existing = await db.users.find_one({"phoneHash": phone_hash}, {"_id": 0})
    if existing:
        log_demo_event(
            f"[{demo_alias_for_user(existing)}]",
            "auth verified existing user",
            uid=existing["uid"],
        )
        return AuthOut(
            token=create_session_token(existing["uid"]),
            uid=existing["uid"],
            onboardingCompleted=bool(existing.get("onboardingCompleted")),
        )

    uid = str(uuid.uuid4())
    user_doc = {
        "uid": uid,
        "phoneHash": phone_hash,
        "phoneLast4": phone_last4,
        "onboardingCompleted": False,
        "relationshipStatus": "single",
        "createdAt": now(),
        "updatedAt": now(),
    }
    await db.users.insert_one(user_doc)
    log_demo_event(
        f"[{demo_alias_for_user(user_doc)}]",
        "auth created user",
        uid=uid,
    )
    return AuthOut(token=create_session_token(uid), uid=uid, onboardingCompleted=False)


# ---------- users ----------
@api.get("/users/me")
async def get_me(user=Depends(current_user)):
    user["createdAt"] = iso(user.get("createdAt"))
    user["updatedAt"] = iso(user.get("updatedAt"))
    return user


@api.put("/users/me")
async def update_me(body: ProfileIn, user=Depends(current_user)):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    update["updatedAt"] = now()
    await db.users.update_one({"uid": user["uid"]}, {"$set": update})
    log_demo_event(f"[{demo_alias_for_user(user)}]", "profile updated", uid=user["uid"])
    updated = await db.users.find_one({"uid": user["uid"]}, {"_id": 0})
    updated["createdAt"] = iso(updated.get("createdAt"))
    updated["updatedAt"] = iso(updated.get("updatedAt"))
    return updated


# ---------- crushes ----------
async def _serialize_crush(doc: dict) -> dict:
    out = {k: v for k, v in doc.items() if k != "_id"}
    for k in ("crushedAt", "expiresAt", "renewedAt", "createdAt", "updatedAt"):
        if k in out and isinstance(out[k], datetime):
            out[k] = iso(out[k])
    return out


async def _detect_mutual(uid: str, target_phone_hash: str, my_phone_hash: str):
    """Mirror of the detectMutualCrush Cloud Function."""
    target = await db.users.find_one({"phoneHash": target_phone_hash}, {"_id": 0})
    if not target:
        return None
    reverse = await db.crushes.find_one(
        {"uid": target["uid"], "phoneHash": my_phone_hash, "status": "pending"},
        {"_id": 0},
    )
    if not reverse:
        return None

    participants = sorted([uid, target["uid"]])
    match_id = "_".join(participants)
    match_doc = {
        "_id": match_id,
        "matchId": match_id,
        "userA": uid,
        "userB": target["uid"],
        "participants": participants,
        "status": "pending_reveal",
        "matchedAt": now(),
        "revealedAt": None,
        "revealedBy": [],
        "mutualReveal": False,
        "lastMessageAt": None,
        "lastMessagePreview": None,
        "matchExpiresAt": None,
        "firstMessageSentAt": None,
        "createdAt": now(),
        "updatedAt": now(),
    }
    try:
        await db.matches.insert_one(match_doc)
        log_demo_event(
            "[MATCH]",
            "created pending_reveal match",
            matchId=match_id,
            userA=demo_alias_for_phone_hash(my_phone_hash),
            userB=demo_alias_for_phone_hash(target_phone_hash),
        )
    except DuplicateKeyError:
        log_demo_event("[MATCH]", "deduplicated reciprocal crush", matchId=match_id)
    # Stamp matchId + status on both crush docs
    await db.crushes.update_one(
        {"uid": uid, "phoneHash": target_phone_hash},
        {"$set": {"status": "matched", "matchId": match_id, "updatedAt": now()}},
    )
    await db.crushes.update_one(
        {"uid": target["uid"], "phoneHash": my_phone_hash},
        {"$set": {"status": "matched", "matchId": match_id, "updatedAt": now()}},
    )
    return match_id


@api.post("/crushes")
async def add_crush(body: CrushIn, user=Depends(current_user)):
    phone = normalize_phone(body.phone)
    if not phone:
        raise HTTPException(400, "phone required")
    phone_hash = sha256(phone)
    phone_last4 = re.sub(r"\D", "", phone)[-4:]
    if phone_hash == user["phoneHash"]:
        raise HTTPException(400, "cannot crush yourself")

    existing = await db.crushes.find_one(
        {"uid": user["uid"], "phoneHash": phone_hash}, {"_id": 0}
    )
    if existing and existing.get("status") in ("pending", "matched"):
        log_demo_event(
            f"[{demo_alias_for_user(user)}]",
            "duplicate crush returned existing",
            target=demo_alias_for_phone_hash(phone_hash),
            status=existing.get("status"),
            matchId=existing.get("matchId"),
        )
        return await _serialize_crush(existing)

    crush_doc = {
        "uid": user["uid"],
        "phoneHash": phone_hash,
        "phoneLast4": phone_last4,
        "status": "pending",
        "crushedAt": now(),
        "expiresAt": now() + timedelta(days=30),
        "renewedAt": None,
        "matchId": None,
        "createdAt": now(),
        "updatedAt": now(),
    }
    await db.crushes.update_one(
        {"uid": user["uid"], "phoneHash": phone_hash},
        {"$set": crush_doc},
        upsert=True,
    )
    # detectMutualCrush trigger (mirror of CF)
    await _detect_mutual(user["uid"], phone_hash, user["phoneHash"])
    fresh = await db.crushes.find_one(
        {"uid": user["uid"], "phoneHash": phone_hash}, {"_id": 0}
    )
    log_demo_event(
        f"[{demo_alias_for_user(user)}]",
        "crush saved",
        target=demo_alias_for_phone_hash(phone_hash),
        status=fresh.get("status") if fresh else None,
        matchId=fresh.get("matchId") if fresh else None,
    )
    return await _serialize_crush(fresh)


@api.get("/crushes")
async def list_crushes(user=Depends(current_user)):
    docs = await db.crushes.find({"uid": user["uid"]}, {"_id": 0}).to_list(500)
    return [await _serialize_crush(d) for d in docs]


# ---------- matches ----------
async def _serialize_match(doc: dict, viewer_uid: str) -> dict:
    out = {k: v for k, v in doc.items() if k != "_id"}
    for k in (
        "matchedAt", "revealedAt", "matchExpiresAt", "lastMessageAt",
        "firstMessageSentAt", "createdAt", "updatedAt",
    ):
        if k in out and isinstance(out[k], datetime):
            out[k] = iso(out[k])
    out["otherUid"] = out["userB"] if out["userA"] == viewer_uid else out["userA"]
    out["iRevealed"] = viewer_uid in (out.get("revealedBy") or [])
    # only expose the other user's name when mutualReveal
    other = await db.users.find_one({"uid": out["otherUid"]}, {"_id": 0})
    out["otherName"] = (other or {}).get("name") if out.get("mutualReveal") else None
    out["otherPhoneLast4"] = (other or {}).get("phoneLast4")
    return out


@api.get("/matches")
async def list_matches(user=Depends(current_user)):
    # Per spec: matches should NEVER appear before status == active
    docs = await db.matches.find(
        {"participants": user["uid"], "status": {"$in": ["active", "unhooked"]}},
        {"_id": 0},
    ).sort("matchedAt", -1).to_list(200)
    return [await _serialize_match(d, user["uid"]) for d in docs if d.get("status") != "unhooked"]


@api.get("/matches/{match_id}")
async def get_match(match_id: str, user=Depends(current_user)):
    doc = await db.matches.find_one({"matchId": match_id}, {"_id": 0})
    if not doc or user["uid"] not in doc.get("participants", []):
        raise HTTPException(404, "not found")
    if doc.get("status") not in ("active", "unhooked"):
        raise HTTPException(403, "match not revealed yet")
    return await _serialize_match(doc, user["uid"])


@api.post("/matches/{match_id}/reveal")
async def reveal(match_id: str, user=Depends(current_user)):
    doc = await db.matches.find_one({"matchId": match_id}, {"_id": 0})
    if not doc or user["uid"] not in doc.get("participants", []):
        raise HTTPException(404, "not found")
    revealed_by = set(doc.get("revealedBy") or [])
    revealed_by.add(user["uid"])
    mutual = set(doc["participants"]).issubset(revealed_by)
    await db.matches.update_one(
        {"matchId": match_id},
        {"$set": {
            "revealedBy": sorted(revealed_by),
            "mutualReveal": mutual,
            "updatedAt": now(),
        }},
    )
    log_demo_event(
        "[REVEAL]",
        "identity reveal updated",
        matchId=match_id,
        user=demo_alias_for_user(user),
        mutual=mutual,
    )
    fresh = await db.matches.find_one({"matchId": match_id}, {"_id": 0})
    return await _serialize_match(fresh, user["uid"])


@api.post("/matches/{match_id}/unhook")
async def unhook(match_id: str, user=Depends(current_user)):
    doc = await db.matches.find_one({"matchId": match_id}, {"_id": 0})
    if not doc or user["uid"] not in doc.get("participants", []):
        raise HTTPException(404, "not found")
    await db.matches.update_one(
        {"matchId": match_id},
        {"$set": {"status": "unhooked", "updatedAt": now()}},
    )
    # soft delete messages
    await db.messages.update_many(
        {"matchId": match_id},
        {"$set": {"deletedAt": now()}},
    )
    # mirror to crush docs for both users
    await db.crushes.update_many(
        {"matchId": match_id},
        {"$set": {"status": "unhooked", "updatedAt": now()}},
    )
    log_demo_event("[UNHOOK]", "match unhooked", matchId=match_id, user=demo_alias_for_user(user))
    return {"ok": True}


# ---------- messages ----------
@api.get("/matches/{match_id}/messages")
async def list_messages(match_id: str, user=Depends(current_user)):
    match = await db.matches.find_one({"matchId": match_id}, {"_id": 0})
    if not match or user["uid"] not in match.get("participants", []):
        raise HTTPException(404, "not found")
    if match.get("status") != "active":
        raise HTTPException(403, "chat unavailable")
    docs = await db.messages.find(
        {"matchId": match_id, "deletedAt": None}, {"_id": 0}
    ).sort("sentAt", 1).to_list(1000)
    for d in docs:
        d["sentAt"] = iso(d.get("sentAt"))
    return docs


@api.post("/matches/{match_id}/messages")
async def send_message(match_id: str, body: MessageIn, user=Depends(current_user)):
    match = await db.matches.find_one({"matchId": match_id}, {"_id": 0})
    if not match or user["uid"] not in match.get("participants", []):
        raise HTTPException(404, "not found")
    if match.get("status") != "active":
        raise HTTPException(403, "chat unavailable")
    text = (body.text or "").strip()
    if not text:
        raise HTTPException(400, "empty message")

    msg = {
        "messageId": str(uuid.uuid4()),
        "matchId": match_id,
        "senderId": user["uid"],
        "type": "text",
        "text": text,
        "sentAt": now(),
        "readBy": [user["uid"]],
        "creditsCharged": 0,
        "deletedAt": None,
    }
    await db.messages.insert_one(msg)
    log_demo_event(
        "[CHAT]",
        "message sent",
        matchId=match_id,
        messageId=msg["messageId"],
        sender=demo_alias_for_user(user),
    )
    msg.pop("_id", None)
    update = {
        "lastMessageAt": msg["sentAt"],
        "lastMessagePreview": text[:60],
        "updatedAt": now(),
    }
    if not match.get("firstMessageSentAt"):
        update["firstMessageSentAt"] = msg["sentAt"]
    await db.matches.update_one({"matchId": match_id}, {"$set": update})
    msg["sentAt"] = iso(msg["sentAt"])
    return msg


# ---------- dev / scheduled reveal ----------
@api.post("/dev/trigger-reveal")
async def trigger_reveal(user=Depends(current_user)):
    """Local-development-only mirror of the dailyReveal Cloud Function.

    This route must stay behind DEMO_MODE and authenticated preview sessions.
    It is not a production API.
    """
    require_demo_mode()
    revealed_at = now()
    expires_at = revealed_at + timedelta(hours=48)
    res = await db.matches.update_many(
        {"status": "pending_reveal"},
        {"$set": {
            "status": "active",
            "revealedAt": revealed_at,
            "matchExpiresAt": expires_at,
            "updatedAt": revealed_at,
        }},
    )
    log_demo_event(
        "[REVEAL]",
        "local development reveal triggered",
        user=demo_alias_for_user(user),
        updated=res.modified_count,
    )
    # TODO: send FCM push notification to participants
    return {"updated": res.modified_count}


@api.get("/")
async def root():
    return {"service": "knook", "status": "ok"}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
