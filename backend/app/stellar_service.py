from stellar_sdk import Server

# Using Stellar Testnet Horizon Server (can be switched to https://horizon.stellar.org for Mainnet)
HORIZON_URL = "https://horizon-testnet.stellar.org"


def verify_invoice_payment_on_stellar(
    freelancer_wallet: str, expected_memo: str
) -> dict:
    """Queries the Stellar Horizon blockchain to check if a transaction

    to the freelancer's wallet contains the invoice's unique stellar_memo.
    """
    server = Server(horizon_url=HORIZON_URL)
    try:
        # Fetch the 20 most recent transactions for the freelancer's Stellar wallet
        transactions = (
            server.transactions()
            .for_account(freelancer_wallet)
            .order(desc=True)
            .limit(20)
            .call()
        )
        records = transactions.get("_embedded", {}).get("records", [])

        for tx in records:
            if tx.get("successful") and tx.get("memo") == expected_memo:
                return {
                    "verified": True,
                    "transaction_hash": tx.get("hash"),
                    "created_at": tx.get("created_at"),
                }
        return {
            "verified": False,
            "message": "No matching on-chain payment found yet.",
        }
    except Exception as e:
        return {"verified": False, "error": str(e)}