from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from ml_model import train_model, predict_recovery


# ---------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------

app = FastAPI(
    title="RecoverAI AI Engine",
    description="AI-powered revenue recovery inference service",
    version="1.0.0",
)


# ---------------------------------------------------------
# Load ML model once when the API starts
# ---------------------------------------------------------

print("Loading RecoverAI ML model...")

model = train_model()

print("RecoverAI ML model loaded successfully.")


# ---------------------------------------------------------
# Request schema
# ---------------------------------------------------------

class TransactionRequest(BaseModel):

    transaction_id: str
    amount: float
    payment_method: str
    failure_code: str
    retry_count: int
    customer_success_rate: float


# ---------------------------------------------------------
# Health check
# ---------------------------------------------------------

@app.get("/")
def root():

    return {
        "success": True,
        "service": "RecoverAI AI Engine",
        "status": "running",
        "model": "Random Forest",
    }


# ---------------------------------------------------------
# Prediction endpoint
# ---------------------------------------------------------

@app.post("/predict")
def predict(
    transaction: TransactionRequest
):

    try:

        transaction_data = (
            transaction.model_dump()
        )

        decision = predict_recovery(
            model,
            transaction_data,
        )

        return {
            "success": True,

            "transactionId":
                transaction.transaction_id,

            "recoveryProbability":
                round(
                    decision.probability,
                    2
                ),

            "recommendedAction":
                decision.action,

            "automatedActionAllowed":
                decision.automated_action_allowed,

            "reason":
                decision.reason,
        }

    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=str(error),
        )