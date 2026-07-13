import importlib.util
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[3]
SCRIPT_PATH = ROOT / "Scripts" / "two_user_reset_seed.py"


def load_tooling():
    spec = importlib.util.spec_from_file_location("two_user_reset_seed", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_test_user_hashes_are_stable_and_distinct():
    tooling = load_tooling()
    user_a = tooling.TEST_USERS["USER_A"]
    user_b = tooling.TEST_USERS["USER_B"]

    assert tooling.normalize_phone("(202) 555-0100") == "2025550100"
    assert tooling.normalize_phone(user_a["phone"]) == "+12025550100"
    assert tooling.phone_hash(user_a["phone"]) != tooling.phone_hash(user_b["phone"])
    assert len(tooling.phone_hash(user_a["phone"])) == 64


def test_seed_docs_do_not_store_raw_phone_numbers():
    tooling = load_tooling()
    docs = tooling.build_user_docs()

    assert {doc["demoAlias"] for doc in docs} == {"USER_A", "USER_B"}
    assert {doc["uid"] for doc in docs} == {"demo-user-a", "demo-user-b"}
    assert all("phone" not in doc for doc in docs)
    assert all(doc["onboardingCompleted"] is True for doc in docs)


def test_reset_tool_refuses_non_demo_mode():
    tooling = load_tooling()

    with pytest.raises(SystemExit, match="DEMO_MODE"):
        tooling.require_demo_mode({"DEMO_MODE": "false"})
