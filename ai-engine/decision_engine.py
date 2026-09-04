from dataclasses import dataclass


# ---------------------------------------------------------
# Decision Result
# ---------------------------------------------------------

@dataclass
class RecoveryDecision:

    probability: float
    action: str
    reason: str
    automated_action_allowed: bool


# ---------------------------------------------------------
# Decision Engine
# ---------------------------------------------------------

def make_recovery_decision(
    recovery_probability,
    failure_code,
    retry_count,
    amount,
):
    """
    Convert ML recovery probability into a safe
    recovery action.

    The ML model predicts probability.
    This engine applies business and safety rules.
    """

    probability = float(
        recovery_probability
    )

    # -----------------------------------------------------
    # SAFETY RULE 1
    # -----------------------------------------------------

    if retry_count >= 2:

        return RecoveryDecision(
            probability=probability,
            action="STOP",
            reason=(
                "Maximum retry limit reached. "
                "Automated retry stopped to prevent "
                "repeated payment attempts."
            ),
            automated_action_allowed=False,
        )

    # -----------------------------------------------------
    # SAFETY RULE 2
    # -----------------------------------------------------

    if (
        probability >= 70
        and failure_code
        in [
            "BANK_TIMEOUT",
            "BANK_ERROR",
        ]
    ):

        return RecoveryDecision(
            probability=probability,
            action="RETRY",
            reason=(
                "High recovery probability and "
                "temporary bank failure detected."
            ),
            automated_action_allowed=True,
        )

    # -----------------------------------------------------
    # MEDIUM PROBABILITY
    # -----------------------------------------------------

    if probability >= 50:

        return RecoveryDecision(
            probability=probability,
            action="NOTIFY",
            reason=(
                "Moderate recovery probability. "
                "Customer notification recommended "
                "before further recovery action."
            ),
            automated_action_allowed=False,
        )

    # -----------------------------------------------------
    # LOW PROBABILITY
    # -----------------------------------------------------

    return RecoveryDecision(
        probability=probability,
        action="ESCALATE",
        reason=(
            "Low recovery probability. "
            "Transaction should be reviewed manually."
        ),
        automated_action_allowed=False,
    )


# ---------------------------------------------------------
# Demo
# ---------------------------------------------------------

if __name__ == "__main__":

    test_transactions = [

        {
            "transaction_id": "TXN-1001",
            "probability": 87,
            "failure_code": "BANK_TIMEOUT",
            "retry_count": 0,
            "amount": 2500,
        },

        {
            "transaction_id": "TXN-1002",
            "probability": 65,
            "failure_code": "AUTH_FAILED",
            "retry_count": 0,
            "amount": 1800,
        },

        {
            "transaction_id": "TXN-1003",
            "probability": 35,
            "failure_code": "UNKNOWN",
            "retry_count": 0,
            "amount": 5000,
        },

        {
            "transaction_id": "TXN-1004",
            "probability": 90,
            "failure_code": "BANK_TIMEOUT",
            "retry_count": 2,
            "amount": 3500,
        },
    ]

    print("\nRECOVERAI DECISION ENGINE")
    print("=" * 60)

    for transaction in test_transactions:

        decision = make_recovery_decision(
            recovery_probability=
                transaction["probability"],

            failure_code=
                transaction["failure_code"],

            retry_count=
                transaction["retry_count"],

            amount=
                transaction["amount"],
        )

        print(
            f"\nTransaction: "
            f"{transaction['transaction_id']}"
        )

        print(
            f"Probability: "
            f"{decision.probability:.0f}%"
        )

        print(
            f"Action: "
            f"{decision.action}"
        )

        print(
            f"Automated action allowed: "
            f"{decision.automated_action_allowed}"
        )

        print(
            f"Reason: "
            f"{decision.reason}"
        )