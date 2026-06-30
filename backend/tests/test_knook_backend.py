"""Knook MVP backend regression tests.

Covers OTP auth, profile, crushes, mutual-match flow, reveal,
messages (ObjectId-serialisation fix), unhook, and dev reveal trigger.
"""
import os
import uuid
import time
import pytest
import requests


BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://anonymous-dating-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


def _unique_phone(suffix: int = 0) -> str:
    # +91 9 + 9-digit random, deterministic-ish per call
    return f"+9190{int(time.time()) % 100000:05d}{suffix:03d}"


def _login(phone: str) -> dict:
    """Mocked OTP login. Returns full auth payload."""
    r = requests.post(f"{API}/auth/request-otp", json={"phone": phone}, timeout=15)
    assert r.status_code == 200, f"request-otp failed: {r.status_code} {r.text}"
    body = r.json()
    assert "verificationId" in body and body.get("devCode") == "123456"
    r2 = requests.post(
        f"{API}/auth/verify-otp",
        json={"phone": phone, "verificationId": body["verificationId"], "code": "123456"},
        timeout=15,
    )
    assert r2.status_code == 200, f"verify-otp failed: {r2.status_code} {r2.text}"
    return r2.json()


def _headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------- Auth ----------------
class TestAuth:
    def test_request_otp_returns_dev_code(self):
        phone = _unique_phone(1)
        r = requests.post(f"{API}/auth/request-otp", json={"phone": phone})
        assert r.status_code == 200
        body = r.json()
        assert "verificationId" in body
        assert body["devCode"] == "123456"

    def test_request_otp_invalid_phone(self):
        r = requests.post(f"{API}/auth/request-otp", json={"phone": "123"})
        assert r.status_code == 400

    def test_verify_otp_new_user(self):
        phone = _unique_phone(2)
        auth = _login(phone)
        assert auth["onboardingCompleted"] is False
        assert auth["token"] == auth["uid"]
        assert auth["uid"]

    def test_verify_otp_existing_user_returns_same_uid(self):
        phone = _unique_phone(3)
        a1 = _login(phone)
        a2 = _login(phone)
        assert a1["uid"] == a2["uid"]

    def test_verify_otp_accepts_any_six_digit_code(self):
        phone = _unique_phone(4)
        r = requests.post(f"{API}/auth/request-otp", json={"phone": phone}).json()
        r2 = requests.post(
            f"{API}/auth/verify-otp",
            json={"phone": phone, "verificationId": r["verificationId"], "code": "987654"},
        )
        assert r2.status_code == 200


# ---------------- Users ----------------
class TestUsers:
    def test_get_me_requires_auth(self):
        r = requests.get(f"{API}/users/me")
        assert r.status_code == 401

    def test_update_and_get_me(self):
        auth = _login(_unique_phone(10))
        h = _headers(auth["token"])
        payload = {
            "name": "TEST_Knook",
            "age": 27,
            "gender": "woman",
            "interestedIn": ["men"],
            "onboardingCompleted": True,
        }
        r = requests.put(f"{API}/users/me", json=payload, headers=h)
        assert r.status_code == 200, r.text
        out = r.json()
        assert out["name"] == "TEST_Knook"
        assert out["onboardingCompleted"] is True
        # GET-verify
        g = requests.get(f"{API}/users/me", headers=h).json()
        assert g["uid"] == auth["uid"]
        assert g["name"] == "TEST_Knook"
        assert "phoneHash" in g and "phoneLast4" in g
        # raw phone must not leak
        assert "phone" not in g or g.get("phone") is None


# ---------------- Crushes ----------------
class TestCrushes:
    def test_add_crush_does_not_store_raw_phone(self):
        auth = _login(_unique_phone(20))
        h = _headers(auth["token"])
        target_phone = _unique_phone(21)
        r = requests.post(f"{API}/crushes", json={"phone": target_phone}, headers=h)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["status"] == "pending"
        assert "phoneHash" in body
        assert "phone" not in body  # raw never returned

    def test_cannot_crush_self(self):
        phone = _unique_phone(22)
        auth = _login(phone)
        h = _headers(auth["token"])
        r = requests.post(f"{API}/crushes", json={"phone": phone}, headers=h)
        assert r.status_code == 400


# ---------------- Mutual / matches / messages / reveal / unhook ----------------
class TestMutualMatchFlow:
    @pytest.fixture(scope="class")
    def two_users(self):
        pA, pB = _unique_phone(30), _unique_phone(31)
        a = _login(pA)
        b = _login(pB)
        return {"A": {"phone": pA, **a}, "B": {"phone": pB, **b}}

    def test_pending_reveal_not_in_matches(self, two_users):
        A, B = two_users["A"], two_users["B"]
        hA, hB = _headers(A["token"]), _headers(B["token"])
        # A crushes B, then B crushes A
        requests.post(f"{API}/crushes", json={"phone": B["phone"]}, headers=hA)
        requests.post(f"{API}/crushes", json={"phone": A["phone"]}, headers=hB)
        # CRITICAL: both should see [] before reveal
        ra = requests.get(f"{API}/matches", headers=hA).json()
        rb = requests.get(f"{API}/matches", headers=hB).json()
        assert ra == [], f"A leaked pending_reveal match: {ra}"
        assert rb == [], f"B leaked pending_reveal match: {rb}"

    def test_dev_trigger_reveal_activates(self, two_users):
        r = requests.post(f"{API}/dev/trigger-reveal")
        assert r.status_code == 200
        assert r.json().get("updated", 0) >= 1
        # now both should see one active match
        hA = _headers(two_users["A"]["token"])
        ms = requests.get(f"{API}/matches", headers=hA).json()
        assert len(ms) >= 1
        m = ms[0]
        assert m["status"] == "active"
        assert m["iRevealed"] is False
        assert m["otherName"] is None  # mutualReveal not yet true
        assert m["matchExpiresAt"] is not None
        two_users["matchId"] = m["matchId"]

    def test_send_message_returns_json_not_500(self, two_users):
        """Regression: POST messages used to raise ObjectId-not-iterable -> 500."""
        match_id = two_users["matchId"]
        h = _headers(two_users["A"]["token"])
        r = requests.post(
            f"{API}/matches/{match_id}/messages",
            json={"text": "hello from A"},
            headers=h,
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        body = r.json()
        assert body["text"] == "hello from A"
        assert body["senderId"] == two_users["A"]["uid"]
        assert "messageId" in body
        # GET back
        g = requests.get(f"{API}/matches/{match_id}/messages", headers=h).json()
        assert len(g) >= 1
        assert g[-1]["text"] == "hello from A"
        assert g[-1].get("deletedAt") is None

    def test_reveal_flow(self, two_users):
        match_id = two_users["matchId"]
        hA = _headers(two_users["A"]["token"])
        hB = _headers(two_users["B"]["token"])
        # A reveals first
        r1 = requests.post(f"{API}/matches/{match_id}/reveal", headers=hA).json()
        assert r1["iRevealed"] is True
        assert r1["mutualReveal"] is False
        assert r1["otherName"] is None
        # B reveals -> mutual
        r2 = requests.post(f"{API}/matches/{match_id}/reveal", headers=hB).json()
        assert r2["mutualReveal"] is True
        # After mutual, name should appear for both
        a_view = requests.get(f"{API}/matches", headers=hA).json()
        b_view = requests.get(f"{API}/matches", headers=hB).json()
        m_a = next(m for m in a_view if m["matchId"] == match_id)
        m_b = next(m for m in b_view if m["matchId"] == match_id)
        # Names exist only if they were set on the user profiles. Set one to confirm flow:
        # Set B's name then re-check
        requests.put(f"{API}/users/me", json={"name": "TEST_Bobby"}, headers=hB)
        a_view2 = requests.get(f"{API}/matches", headers=hA).json()
        m_a2 = next(m for m in a_view2 if m["matchId"] == match_id)
        assert m_a2["otherName"] == "TEST_Bobby"
        assert m_b["mutualReveal"] is True

    def test_unhook_removes_match_and_soft_deletes(self, two_users):
        match_id = two_users["matchId"]
        hA = _headers(two_users["A"]["token"])
        hB = _headers(two_users["B"]["token"])
        r = requests.post(f"{API}/matches/{match_id}/unhook", headers=hA)
        assert r.status_code == 200
        # match must disappear from list for both
        a = requests.get(f"{API}/matches", headers=hA).json()
        b = requests.get(f"{API}/matches", headers=hB).json()
        assert all(m["matchId"] != match_id for m in a)
        assert all(m["matchId"] != match_id for m in b)
        # subsequent send should now 403 (status != active)
        r2 = requests.post(
            f"{API}/matches/{match_id}/messages",
            json={"text": "post-unhook"},
            headers=hA,
        )
        assert r2.status_code == 403


# ---------------- 403 on non-active matches ----------------
class TestNonActiveProtections:
    def test_send_message_on_pending_reveal_is_403(self):
        pA, pB = _unique_phone(50), _unique_phone(51)
        a = _login(pA)
        b = _login(pB)
        hA = _headers(a["token"])
        hB = _headers(b["token"])
        ca = requests.post(f"{API}/crushes", json={"phone": pB}, headers=hA).json()
        cb = requests.post(f"{API}/crushes", json={"phone": pA}, headers=hB).json()
        match_id = ca.get("matchId") or cb.get("matchId")
        assert match_id, "mutual match should have been created"
        # Without trigger-reveal, status is pending_reveal => 403
        r = requests.post(
            f"{API}/matches/{match_id}/messages",
            json={"text": "should fail"},
            headers=hA,
        )
        assert r.status_code == 403
