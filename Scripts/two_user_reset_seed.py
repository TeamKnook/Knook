#!/usr/bin/env python3
"""Reset and seed Knook's two-user local simulation data.

This script is intentionally scoped to Backend/preview-api. It refuses to run
unless Backend/preview-api/.env has DEMO_MODE=true, and it only deletes data
related to the two fixed local test users.
"""
from __future__ import annotations

import argparse
import hashlib
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pymongo import MongoClient


ROOT = Path(__file__).resolve().parents[1]
ENV_PATH = ROOT / "Backend" / "preview-api" / ".env"

TEST_USERS = {
    "USER_A": {"uid": "demo-user-a", "phone": "+15555550100", "name": "Alex"},
    "USER_B": {"uid": "demo-user-b", "phone": "+15555550101", "name": "Jordan"},
}


def normalize_phone(raw: str) -> str:
    digits = re.sub(r"\D", "", raw or "")
    if raw and raw.strip().startswith("+"):
        return f"+{digits}"
    return digits


def phone_hash(phone: str) -> str:
    return hashlib.sha256(normalize_phone(phone).encode("utf-8")).hexdigest()


def parse_env(path: Path = ENV_PATH) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        raise SystemExit(f"Missing preview API env file: {path}")
    for line in path.read_text().splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def require_demo_mode(env: dict[str, str]) -> None:
    if env.get("DEMO_MODE", "").lower() != "true":
        raise SystemExit("Refusing to reset/seed data because DEMO_MODE is not true.")


def build_user_docs() -> list[dict[str, Any]]:
    timestamp = datetime.now(timezone.utc)
    docs = []
    for alias, data in TEST_USERS.items():
        digits = re.sub(r"\D", "", data["phone"])
        docs.append(
            {
                "uid": data["uid"],
                "phoneHash": phone_hash(data["phone"]),
                "phoneLast4": digits[-4:],
                "name": data["name"],
                "relationshipStatus": "single",
                "onboardingCompleted": True,
                "demoAlias": alias,
                "createdAt": timestamp,
                "updatedAt": timestamp,
            }
        )
    return docs


def reset_data(db, dry_run: bool = False) -> dict[str, int]:
    user_docs = build_user_docs()
    uids = [doc["uid"] for doc in user_docs]
    hashes = [doc["phoneHash"] for doc in user_docs]
    phones = [normalize_phone(data["phone"]) for data in TEST_USERS.values()]

    existing_users = list(db.users.find({"$or": [{"uid": {"$in": uids}}, {"phoneHash": {"$in": hashes}}]}))
    all_uids = sorted(set(uids + [user["uid"] for user in existing_users if user.get("uid")]))

    matches = list(db.matches.find({"participants": {"$in": all_uids}}, {"matchId": 1}))
    match_ids = sorted({match.get("matchId") for match in matches if match.get("matchId")})

    counts = {
        "messages": db.messages.count_documents({"matchId": {"$in": match_ids}}) if match_ids else 0,
        "matches": len(match_ids),
        "crushes": db.crushes.count_documents(
            {
                "$or": [
                    {"uid": {"$in": all_uids}},
                    {"phoneHash": {"$in": hashes}},
                    {"matchId": {"$in": match_ids}},
                ]
            }
        ),
        "verifications": db.verifications.count_documents({"phone": {"$in": phones}}),
        "users": db.users.count_documents({"$or": [{"uid": {"$in": uids}}, {"phoneHash": {"$in": hashes}}]}),
    }

    if dry_run:
        return counts

    if match_ids:
        db.messages.delete_many({"matchId": {"$in": match_ids}})
    db.matches.delete_many({"participants": {"$in": all_uids}})
    db.crushes.delete_many(
        {
            "$or": [
                {"uid": {"$in": all_uids}},
                {"phoneHash": {"$in": hashes}},
                {"matchId": {"$in": match_ids}},
            ]
        }
    )
    db.verifications.delete_many({"phone": {"$in": phones}})
    db.users.delete_many({"$or": [{"uid": {"$in": uids}}, {"phoneHash": {"$in": hashes}}]})
    return counts


def seed_users(db, dry_run: bool = False) -> dict[str, int]:
    docs = build_user_docs()
    if dry_run:
        return {"users": len(docs)}
    for doc in docs:
        db.users.update_one(
            {"uid": doc["uid"]},
            {"$set": doc},
            upsert=True,
        )
    return {"users": len(docs)}


def main() -> int:
    parser = argparse.ArgumentParser(description="Reset and seed Knook local two-user simulation data.")
    parser.add_argument("--reset", action="store_true", help="Delete local data for Alex/Jordan only.")
    parser.add_argument("--seed", action="store_true", help="Create clean Alex/Jordan preview users.")
    parser.add_argument("--dry-run", action="store_true", help="Show what would happen without writing data.")
    args = parser.parse_args()

    if not args.reset and not args.seed:
        parser.error("choose --reset, --seed, or both")

    env = parse_env()
    require_demo_mode(env)

    mongo_url = env.get("MONGO_URL") or os.environ.get("MONGO_URL")
    db_name = env.get("DB_NAME") or os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        raise SystemExit("MONGO_URL and DB_NAME are required in Backend/preview-api/.env")

    client = MongoClient(mongo_url, serverSelectionTimeoutMS=2000)
    client.admin.command("ping")
    db = client[db_name]

    results: dict[str, dict[str, int]] = {}
    if args.reset:
        results["reset"] = reset_data(db, dry_run=args.dry_run)
    if args.seed:
        results["seed"] = seed_users(db, dry_run=args.dry_run)

    action = "Would complete" if args.dry_run else "Completed"
    print(f"{action} Knook two-user local simulation reset/seed.")
    for group, counts in results.items():
        print(f"{group}: " + ", ".join(f"{key}={value}" for key, value in sorted(counts.items())))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
