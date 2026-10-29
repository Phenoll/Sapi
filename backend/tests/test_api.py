import uuid
from fastapi.testclient import TestClient
from app.main import app


def test_health_or_root():
    with TestClient(app) as client:
        response = client.get("/invoices")
        assert response.status_code == 200


def test_create_invoice_auto_generates_stellar_memo():
    with TestClient(app) as client:
        test_invoice_num = f"INV-TEST-{uuid.uuid4().hex[:6].upper()}"

        payload = {
            "invoice_number": test_invoice_num,
            "client_name": "Paystack Design Team",
            "amount": 250000.0,
            "currency": "NGN",
            "due_date": "2026-11-15",
        }
        response = client.post("/invoices", json=payload)

        assert response.status_code == 200
        data = response.json()
        assert data["client_name"] == "Paystack Design Team"
        assert data["status"] == "Unpaid"
        assert data["stellar_memo"] == f"SAPI-{test_invoice_num}"