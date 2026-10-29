from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from app.database import create_db_and_tables, get_session
from app.models import Client, Invoice
from app.stellar_service import verify_invoice_payment_on_stellar


@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield


app = FastAPI(
    title="Sapi API",
    description="Open-source invoicing, client tracking, and Stellar USDC settlement API for African freelancers.",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "sapi-backend", "stellar_network": "testnet"}


# --- CLIENT ENDPOINTS ---
@app.post("/clients", response_model=Client)
def create_client(
    client: Client,
    owner_email: Optional[str] = None,
    session: Session = Depends(get_session),
):
    if owner_email and (not client.owner_email or client.owner_email == "default@sapi.com"):
        client.owner_email = owner_email
    if not client.owner_email:
        client.owner_email = "default@sapi.com"

    session.add(client)
    session.commit()
    session.refresh(client)
    return client


@app.get("/clients")
def list_clients_with_stats(
    owner_email: Optional[str] = None,
    session: Session = Depends(get_session),
):
    """Returns all clients along with their computed Total Billed, Outstanding, and Invoice count for the Clients screen."""
    client_query = select(Client)
    invoice_query = select(Invoice)
    if owner_email:
        client_query = client_query.where(Client.owner_email == owner_email)
        invoice_query = invoice_query.where(Invoice.owner_email == owner_email)

    clients = session.exec(client_query).all()
    invoices = session.exec(invoice_query).all()

    enriched_clients = []
    for c in clients:
        c_invoices = [
            inv for inv in invoices
            if inv.client_id == c.id or inv.client_name.lower() == c.name.lower()
        ]
        total_billed = sum(inv.amount for inv in c_invoices)
        outstanding = sum(
            inv.amount for inv in c_invoices if inv.status in ["Unpaid", "Overdue", "Pending"]
        )
        last_invoice = c_invoices[-1].due_date if c_invoices else "No invoices yet"

        enriched_clients.append({
            **c.model_dump(),
            "invoices_count": len(c_invoices),
            "total_billed": total_billed,
            "outstanding": outstanding,
            "last_invoice": last_invoice,
        })
    return enriched_clients


# --- INVOICE ENDPOINTS ---
@app.post("/invoices", response_model=Invoice)
def create_invoice(
    invoice: Invoice,
    owner_email: Optional[str] = None,
    session: Session = Depends(get_session),
):
    if owner_email and (not invoice.owner_email or invoice.owner_email == "default@sapi.com"):
        invoice.owner_email = owner_email
    if not invoice.owner_email:
        invoice.owner_email = "default@sapi.com"

    if not invoice.due_date:
        invoice.due_date = "24 May 2026"

    if not invoice.stellar_memo:
        invoice.stellar_memo = f"SAPI-{invoice.invoice_number}"
    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    return invoice


@app.get("/invoices", response_model=List[Invoice])
def list_invoices(
    owner_email: Optional[str] = None,
    session: Session = Depends(get_session),
):
    query = select(Invoice)
    if owner_email:
        query = query.where(Invoice.owner_email == owner_email)
    return session.exec(query.order_by(Invoice.id.desc())).all()


@app.get("/invoices/{invoice_id}", response_model=Invoice)
def get_single_invoice(invoice_id: int, session: Session = Depends(get_session)):
    invoice = session.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@app.patch("/invoices/{invoice_id}/status", response_model=Invoice)
def update_invoice_status(invoice_id: int, status: str, session: Session = Depends(get_session)):
    invoice = session.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice.status = status
    session.add(invoice)
    session.commit()
    session.refresh(invoice)
    return invoice


@app.post("/invoices/{invoice_id}/verify-stellar")
def verify_stellar_payment(
    invoice_id: int,
    freelancer_wallet: str,
    tx_hash: str = "",
    session: Session = Depends(get_session),
):
    """Verifies Stellar payment via Horizon API or records direct Freighter Testnet payment."""
    invoice = session.get(Invoice, invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # If client paid directly via Freighter wallet and returned a tx_hash, or verify via Horizon memo
    if tx_hash:
        invoice.status = "Paid"
        invoice.stellar_tx_hash = tx_hash
        session.add(invoice)
        session.commit()
        session.refresh(invoice)
        return {"verified": True, "invoice": invoice, "transaction_hash": tx_hash}

    result = verify_invoice_payment_on_stellar(
        freelancer_wallet=freelancer_wallet, expected_memo=invoice.stellar_memo
    )
    if result.get("verified"):
        invoice.status = "Paid"
        invoice.stellar_tx_hash = result.get("transaction_hash")
        session.add(invoice)
        session.commit()
        session.refresh(invoice)

    return {"verified": result.get("verified", False), "invoice": invoice, "stellar_verification": result}


# --- DASHBOARD SUMMARY ENDPOINT ---
@app.get("/dashboard/summary")
def get_dashboard_summary(
    owner_email: Optional[str] = None,
    session: Session = Depends(get_session),
):
    invoice_query = select(Invoice)
    client_query = select(Client)
    if owner_email:
        invoice_query = invoice_query.where(Invoice.owner_email == owner_email)
        client_query = client_query.where(Client.owner_email == owner_email)

    invoices = session.exec(invoice_query).all()
    clients = session.exec(client_query).all()

    total_paid = sum(inv.amount for inv in invoices if inv.status.lower() == "paid")
    total_outstanding = sum(inv.amount for inv in invoices if inv.status.lower() in ["unpaid", "pending", "overdue"])
    total_overdue = sum(inv.amount for inv in invoices if inv.status.lower() == "overdue")
    draft_count = sum(1 for inv in invoices if inv.status.lower() == "draft")
    pending_count = sum(1 for inv in invoices if inv.status.lower() in ["unpaid", "pending"])
    overdue_count = sum(1 for inv in invoices if inv.status.lower() == "overdue")

    return {
        "total_invoices": len(invoices),
        "total_clients": len(clients),
        "active_clients": sum(1 for c in clients if c.status.lower() == "active"),
        "total_paid": total_paid,
        "total_outstanding": total_outstanding,
        "total_overdue": total_overdue,
        "draft_count": draft_count,
        "pending_count": pending_count,
        "overdue_count": overdue_count,
    }