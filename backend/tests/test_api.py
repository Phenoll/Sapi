from app.main import app
from fastapi.testclient import TestClient
import uuid

# Using 'with TestClient(app)' forces FastAPI to run the lifespan event
# so it automatically creates the SQLite tables before the test runs!

def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


def test_create_invoice_auto_generates_stellar_memo():
    with TestClient(app) as client:
        # We use a random UUID for the invoice number so the test never fails 
        # due to a "unique constraint" if you run pytest multiple times!
        test_invoice_num = f"INV-TEST-{uuid.uuid4().hex[:6]}"
        
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
        assert data["status"] == "PENDING"
        assert data["stellar_memo"] == f"SAPI-{test_invoice_num}"