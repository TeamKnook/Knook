"""Native-development edge-case API checks.

These tests exercise the local preview API behind the Knook Dev app. They are
not a Firebase migration; they lock down the product rules the Firebase
implementation must later preserve.
"""
import os
import time

import pytest
import requests


BASE_URL = os.environ.get("TEST_BACKEND_URL", "http://127.0.0.1:8000").rstrip("/")
API = f"{BASE_URL}/api"
REQUEST_TIMEOUT = 15


def _request(method: str, path: str, **kwargs) -> requests.Response:
    kwargs.setdefault("timeout", REQUEST_TIMEOUT)
    try:
        return requests.request(method, f"{API}{path}", **kwargs)
    except requests.RequestException as exc:
        pytest.fail(
            f"Local backend unavailable at {BASE_URL}. Start it with "
            "`cd Backend/preview-api && source .venv/bin/activate && "
            "uvicorn server:app --host 127.0.0.1 --port 8000`. "
            f"Original error: {exc}",
            pytrace=False,
        )


def _get(path: str, **kwargs) -> requests.Response:
    return _request("GET", path, **kwargs)


def _post(path: str, **kwargs) -> requests.Response:
    return _request("POST", path, **kwargs)


def _put(path: str, **kwargs) -> requests.Response:
    return _request("PUT", path, **kwargs)


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def _unique_phone(seed: int) -> str:
    return f"+15559{int(time.time() * 1000) % 100000:05d}{seed:02d}"


def _login(phone: str, name: str) -> dict:
    request = _post("/auth/request-otp", json={"phone": phone})
    assert request.status_code == 200, request.text
    otp = request.json()
    verify = _post(
        "/auth/verify-otp",
        json={
            "phone": phone,
            "verificationId": otp["verificationId"],
            "code": otp["devCode"],
        },
    )
    assert verify.status_code == 200, verify.text
    auth = verify.json()
    update = _put(
        "/users/me",
        json={"name": name, "onboardingCompleted": True},
        headers=_headers(auth["token"]),
    )
    assert update.status_code == 200, update.text
    return {"phone": phone, **auth}


def _create_pending_pair():
    user_a = _login(_unique_phone(10), "Edge Alex")
    user_b = _login(_unique_phone(11), "Edge Jordan")
    headers_a = _headers(user_a["token"])
    headers_b = _headers(user_b["token"])

    first = _post("/crushes", json={"phone": user_b["phone"]}, headers=headers_a)
    assert first.status_code == 200, first.text
    second = _post("/crushes", json={"phone": user_a["phone"]}, headers=headers_b)
    assert second.status_code == 200, second.text

    match_id = second.json().get("matchId") or first.json().get("matchId")
    assert match_id
    return user_a, user_b, headers_a, headers_b, match_id


def _reveal_pending_matches(headers: dict) -> None:
    reveal = _post("/dev/trigger-reveal", headers=headers)
    assert reveal.status_code == 200, reveal.text


def _find_match(headers: dict, match_id: str) -> dict:
    matches = _get("/matches", headers=headers)
    assert matches.status_code == 200, matches.text
    return next(match for match in matches.json() if match["matchId"] == match_id)


def test_duplicate_crush_submission_is_idempotent_before_and_after_match():
    user_a = _login(_unique_phone(20), "Duplicate Alex")
    user_b = _login(_unique_phone(21), "Duplicate Jordan")
    headers_a = _headers(user_a["token"])
    headers_b = _headers(user_b["token"])

    first = _post("/crushes", json={"phone": user_b["phone"]}, headers=headers_a)
    second = _post("/crushes", json={"phone": user_b["phone"]}, headers=headers_a)
    assert first.status_code == 200, first.text
    assert second.status_code == 200, second.text
    assert first.json()["phoneHash"] == second.json()["phoneHash"]
    assert first.json()["status"] == second.json()["status"] == "pending"

    reciprocal = _post("/crushes", json={"phone": user_a["phone"]}, headers=headers_b)
    duplicate_after_match = _post("/crushes", json={"phone": user_a["phone"]}, headers=headers_b)
    assert reciprocal.status_code == 200, reciprocal.text
    assert duplicate_after_match.status_code == 200, duplicate_after_match.text
    assert reciprocal.json()["matchId"] == duplicate_after_match.json()["matchId"]
    assert reciprocal.json()["status"] == duplicate_after_match.json()["status"] == "matched"

    matches_before_reveal = _get("/matches", headers=headers_a)
    assert matches_before_reveal.status_code == 200
    assert all(match["matchId"] != reciprocal.json()["matchId"] for match in matches_before_reveal.json())


def test_daily_reveal_is_idempotent_and_keeps_reveal_timestamps_stable():
    _user_a, _user_b, headers_a, _headers_b, match_id = _create_pending_pair()

    _reveal_pending_matches(headers_a)
    first_view = _find_match(headers_a, match_id)
    second_reveal = _post("/dev/trigger-reveal", headers=headers_a)
    assert second_reveal.status_code == 200, second_reveal.text
    second_view = _find_match(headers_a, match_id)

    assert second_reveal.json()["updated"] == 0
    assert first_view["status"] == second_view["status"] == "active"
    assert first_view["revealedAt"] == second_view["revealedAt"]
    assert first_view["matchExpiresAt"] == second_view["matchExpiresAt"]


def test_identity_reveal_is_idempotent_and_mutual_reveal_survives_refresh():
    _user_a, _user_b, headers_a, headers_b, match_id = _create_pending_pair()
    _reveal_pending_matches(headers_a)

    first_a = _post(f"/matches/{match_id}/reveal", headers=headers_a)
    second_a = _post(f"/matches/{match_id}/reveal", headers=headers_a)
    assert first_a.status_code == 200, first_a.text
    assert second_a.status_code == 200, second_a.text
    assert second_a.json()["revealedBy"].count(first_a.json()["revealedBy"][0]) == 1
    assert second_a.json()["mutualReveal"] is False

    reveal_b = _post(f"/matches/{match_id}/reveal", headers=headers_b)
    assert reveal_b.status_code == 200, reveal_b.text
    assert reveal_b.json()["mutualReveal"] is True

    refreshed_a = _find_match(headers_a, match_id)
    refreshed_b = _find_match(headers_b, match_id)
    assert refreshed_a["mutualReveal"] is True
    assert refreshed_b["mutualReveal"] is True
    assert refreshed_a["otherName"] == "Edge Jordan"
    assert refreshed_b["otherName"] == "Edge Alex"


def test_unhook_blocks_stale_match_and_message_access():
    _user_a, _user_b, headers_a, headers_b, match_id = _create_pending_pair()
    _reveal_pending_matches(headers_a)

    sent = _post(f"/matches/{match_id}/messages", json={"text": "before unhook"}, headers=headers_a)
    assert sent.status_code == 200, sent.text

    unhook = _post(f"/matches/{match_id}/unhook", headers=headers_a)
    assert unhook.status_code == 200, unhook.text

    for headers in (headers_a, headers_b):
        listed = _get("/matches", headers=headers)
        assert listed.status_code == 200, listed.text
        assert all(match["matchId"] != match_id for match in listed.json())

        stale_match = _get(f"/matches/{match_id}", headers=headers)
        stale_messages = _get(f"/matches/{match_id}/messages", headers=headers)
        stale_send = _post(f"/matches/{match_id}/messages", json={"text": "after"}, headers=headers)

        assert stale_match.status_code == 410
        assert stale_messages.status_code == 410
        assert stale_send.status_code == 410


def test_unhooked_pair_can_create_new_pending_reveal_match():
    user_a, user_b, headers_a, headers_b, match_id = _create_pending_pair()
    _reveal_pending_matches(headers_a)

    unhook = _post(f"/matches/{match_id}/unhook", headers=headers_a)
    assert unhook.status_code == 200, unhook.text

    recrush_a = _post("/crushes", json={"phone": user_b["phone"]}, headers=headers_a)
    recrush_b = _post("/crushes", json={"phone": user_a["phone"]}, headers=headers_b)
    assert recrush_a.status_code == 200, recrush_a.text
    assert recrush_b.status_code == 200, recrush_b.text
    assert recrush_b.json()["matchId"] == match_id

    hidden_before_reveal = _get("/matches", headers=headers_a)
    assert hidden_before_reveal.status_code == 200, hidden_before_reveal.text
    assert all(match["matchId"] != match_id for match in hidden_before_reveal.json())

    reveal = _post("/dev/trigger-reveal", headers=headers_a)
    assert reveal.status_code == 200, reveal.text
    assert reveal.json()["updated"] >= 1

    revealed = _find_match(headers_a, match_id)
    assert revealed["status"] == "active"
    assert revealed["revealedAt"]
