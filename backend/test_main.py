import uuid
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_create_and_isolate_clients():
    # 1. Create a client for User A
    res_a = client.post(
        "/clients?owner_email=alice@sapi.space",
        json={
            "name": "Paystack Labs",
            "email": "billing@paystack.com",
            "company": "Paystack",
            "owner_email": "alice@sapi.space",
        },
    )
    assert res_a.status_code in (200, 201)
    data_a = res_a.json()
    assert data_a["name"] == "Paystack Labs"

    # 2. Verify User B does NOT see User A's clients (Multi-tenant isolation)
    res_b = client.get("/clients?owner_email=bob@sapi.space")
    assert res_b.status_code == 200
    bob_clients = res_b.json()
    assert all(c.get("owner_email") != "alice@sapi.space" for c in bob_clients)


def test_create_invoice_and_public_checkout_view():
    # 1. Create an invoice with a required unique invoice_number
    inv_num = f"INV-{uuid.uuid4().hex[:6].upper()}"
    invoice_payload = {
        "invoice_number": inv_num,
        "client_name": "Stellar Development Foundation",
        "client_email": "grants@stellar.org",
        "service_summary": "UI/UX & Frontend Architecture",
        "due_date": "24 May 2026",
        "amount": 1250.00,
        "currency": "USDC",
        "status": "Pending",
        "owner_email": "alice@sapi.space",
    }
    create_res = client.post(
        "/invoices?owner_email=alice@sapi.space",
        json=invoice_payload,
    )
    assert create_res.status_code in (200, 201)
    created_invoice = create_res.json()
    invoice_id = created_invoice["id"]

    # 2. Verify the public /pay/[id] endpoint works without requiring owner_email
    public_res = client.get(f"/invoices/{invoice_id}")
    assert public_res.status_code == 200
    assert public_res.json()["amount"] == 1250.00