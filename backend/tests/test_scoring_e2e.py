"""Integration tests for scoring router endpoints.

Tests POST /api/scoring/evaluate, GET /api/scoring/results/{session_id},
and POST /api/scoring/rescore endpoints.
"""

import uuid

import pytest
from fastapi.testclient import TestClient


# We expect app to be importable; it defines the FastAPI application
try:
    from app.main import app
except ImportError:
    pass  # RED phase: may not exist yet


@pytest.fixture
def client():
    """Return a TestClient for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def valid_payload():
    """Return a valid scoring evaluate payload."""
    return {
        "session_id": str(uuid.uuid4()),
        "question_index": 0,
        "question_id": "js_exam_00b2138b2b_q01",
    }


class TestEvaluateEndpoint:
    """Tests for POST /api/scoring/evaluate."""

    def test_evaluate_valid_request(self, client, valid_payload):
        """POST with valid UUID session_id, non-negative question_index, valid question_id -> 200."""
        response = client.post("/api/scoring/evaluate", json=valid_payload)
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "accepted"

    def test_evaluate_empty_session_id(self, client):
        """POST with session_id="" -> 422."""
        response = client.post(
            "/api/scoring/evaluate",
            json={
                "session_id": "",
                "question_index": 0,
                "question_id": "js_exam_00b2138b2b_q01",
            },
        )
        assert response.status_code == 422

    def test_evaluate_negative_question_index(self, client):
        """POST with question_index=-1 -> 422."""
        response = client.post(
            "/api/scoring/evaluate",
            json={
                "session_id": str(uuid.uuid4()),
                "question_index": -1,
                "question_id": "js_exam_00b2138b2b_q01",
            },
        )
        assert response.status_code == 422

    def test_evaluate_invalid_session_id(self, client):
        """POST with session_id containing path traversal chars -> 422."""
        response = client.post(
            "/api/scoring/evaluate",
            json={
                "session_id": "../../etc/passwd",
                "question_index": 0,
                "question_id": "js_exam_00b2138b2b_q01",
            },
        )
        assert response.status_code == 422

    def test_evaluate_nonexistent_question(self, client):
        """POST with question_id that doesn't exist -> 404."""
        response = client.post(
            "/api/scoring/evaluate",
            json={
                "session_id": str(uuid.uuid4()),
                "question_index": 0,
                "question_id": "nonexistent_question_id",
            },
        )
        assert response.status_code == 404


class TestGetResultsEndpoint:
    """Tests for GET /api/scoring/results/{session_id}."""

    def test_get_results(self, client):
        """GET with a valid session_id -> 200 + JSON array."""
        session_id = str(uuid.uuid4())
        response = client.get(f"/api/scoring/results/{session_id}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_results_empty_session(self, client):
        """GET with a session_id that has no results -> 200 + []."""
        session_id = str(uuid.uuid4())
        response = client.get(f"/api/scoring/results/{session_id}")
        assert response.status_code == 200
        assert response.json() == []

    def test_get_results_invalid_session_id(self, client):
        """GET with path-traversal session_id -> 422."""
        response = client.get("/api/scoring/results/../../etc/passwd")
        assert response.status_code == 422


class TestRescoreEndpoint:
    """Tests for POST /api/scoring/rescore."""

    def test_rescore_valid(self, client, valid_payload):
        """POST with valid payload -> 200 + {"status": "accepted"}."""
        response = client.post("/api/scoring/rescore", json=valid_payload)
        assert response.status_code == 200
        assert response.json()["status"] == "accepted"

    def test_rescore_rate_limit(self, client):
        """POST 4 times for same question -> 4th call returns 429."""
        session_id = str(uuid.uuid4())
        payload = {
            "session_id": session_id,
            "question_index": 0,
            "question_id": "js_exam_00b2138b2b_q01",
        }
        # First 3 calls should succeed
        for i in range(3):
            response = client.post("/api/scoring/rescore", json=payload)
            assert response.status_code == 200, f"Call {i+1} should succeed"

        # 4th call should hit rate limit
        response = client.post("/api/scoring/rescore", json=payload)
        assert response.status_code == 429

    def test_rescore_missing_fields(self, client):
        """POST with missing question_id -> 422."""
        response = client.post(
            "/api/scoring/rescore",
            json={
                "session_id": str(uuid.uuid4()),
                "question_index": 0,
                # missing question_id
            },
        )
        assert response.status_code == 422
