from datetime import datetime, timezone
from typing import Optional
from sqlmodel import Field, SQLModel


class Client(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = Field(default="Nigeria")
    status: str = Field(default="Active")  # Active, Inactive
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


class Invoice(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    invoice_number: str = Field(unique=True, index=True)
    client_id: Optional[int] = Field(default=None, foreign_key="client.id")
    client_name: str
    client_email: Optional[str] = None
    service_summary: Optional[str] = Field(default="Design Services")  # Subtitle shown under Client Name in tables
    issue_date: str = Field(default="10 May 2026")
    due_date: str
    amount: float
    currency: str = Field(default="NGN")
    status: str = Field(default="Unpaid")  # Paid, Unpaid, Overdue, Draft, Pending
    line_items_json: str = Field(default="[]")  # JSON string storing [{description, subtitle, qty, rate, amount}]
    notes: Optional[str] = None
    stellar_memo: Optional[str] = None  # e.g. SAPI-INV-0031
    stellar_tx_hash: Optional[str] = None  # Stores on-chain TX hash when paid via Stellar
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )