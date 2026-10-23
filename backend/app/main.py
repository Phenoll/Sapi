from fastapi import FastAPI

app = FastAPI(
    title="Sapi API",
    description="Open-source invoicing and Stellar USDC payment tracking API for African freelancers.",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "sapi-backend",
        "stellar_network": "testnet",
    }