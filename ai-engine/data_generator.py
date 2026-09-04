import random
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

NUM_TRANSACTIONS = 5000
NUM_CUSTOMERS = 500

random.seed(42)
np.random.seed(42)

FAILURE_PROFILES = {
    "BANK_TIMEOUT": {
        "weight": 0.30,
        "recovery_probability": 0.78,
    },
    "BANK_ERROR": {
        "weight": 0.20,
        "recovery_probability": 0.65,
    },
    "AUTH_FAILED": {
        "weight": 0.18,
        "recovery_probability": 0.42,
    },
    "INSUFFICIENT_FUNDS": {
        "weight": 0.20,
        "recovery_probability": 0.38,
    },
    "UNKNOWN": {
        "weight": 0.12,
        "recovery_probability": 0.30,
    },
}

PAYMENT_METHODS = [
    "UPI",
    "CARD",
    "NETBANKING",
    "WALLET",
]

CUSTOMER_NAMES = [
    "Rahul Sharma",
    "Priya Patil",
    "Amit Joshi",
    "Sneha Kulkarni",
    "Rohan Deshmukh",
    "Neha Shah",
    "Aditya More",
    "Pooja Jadhav",
    "Kunal Patil",
    "Ananya Kulkarni",
]


# ---------------------------------------------------------
# Utility functions
# ---------------------------------------------------------

def choose_failure_code():
    codes = list(FAILURE_PROFILES.keys())
    weights = [
        FAILURE_PROFILES[code]["weight"]
        for code in codes
    ]

    return random.choices(
        codes,
        weights=weights,
        k=1
    )[0]


def choose_amount():
    """
    Generate realistic-looking Indian transaction amounts.
    """

    amount = np.random.lognormal(
        mean=7.8,
        sigma=0.8
    )

    amount = max(
        200,
        min(amount, 75000)
    )

    return round(float(amount), 2)


def create_customers():
    """
    Create stable customer profiles.

    Each customer keeps the same historical success rate
    across all of their transactions.
    """

    customers = []

    for customer_id in range(
        1,
        NUM_CUSTOMERS + 1
    ):
        name = CUSTOMER_NAMES[
            (customer_id - 1)
            % len(CUSTOMER_NAMES)
        ]

        total_transactions = random.randint(
            10,
            50
        )

        success_rate = round(
            random.uniform(
                45,
                98
            ),
            2
        )

        successful_transactions = round(
            total_transactions
            * success_rate
            / 100
        )

        failed_transactions = (
            total_transactions
            - successful_transactions
        )

        customers.append(
            {
                "customer_id": customer_id,
                "customer_ref":
                    f"CUST-{customer_id:04d}",
                "customer_name": name,
                "customer_success_rate":
                    success_rate,
                "customer_total_transactions":
                    total_transactions,
                "customer_successful_transactions":
                    successful_transactions,
                "customer_failed_transactions":
                    failed_transactions,
            }
        )

    return customers


def calculate_prediction(
    failure_code,
    customer_success_rate,
    retry_count,
):
    """
    Calculate predicted recovery probability.
    """

    base_probability = (
        FAILURE_PROFILES[
            failure_code
        ]["recovery_probability"]
    )

    probability = base_probability

    # Customer history
    if customer_success_rate >= 80:
        probability += 0.10

    elif customer_success_rate >= 60:
        probability += 0.05

    elif customer_success_rate < 40:
        probability -= 0.10

    # Previous retries
    if retry_count >= 2:
        probability -= 0.25

    elif retry_count == 1:
        probability -= 0.05

    probability = max(
        0,
        min(1, probability)
    )

    probability_percent = round(
        probability * 100,
        2
    )

    # -----------------------------------------------------
    # Decision rules
    # -----------------------------------------------------

    if retry_count >= 2:
        action = "STOP"

    elif (
        probability_percent >= 70
        and failure_code in [
            "BANK_TIMEOUT",
            "BANK_ERROR",
        ]
    ):
        action = "RETRY"

    elif probability_percent >= 50:
        action = "NOTIFY"

    else:
        action = "ESCALATE"

    return probability_percent, action


def simulate_actual_outcome(
    failure_code,
    predicted_probability,
    action,
):
    """
    Simulate whether the recommended recovery action
    actually succeeds.

    IMPORTANT:
    STOP does not produce recovery because the system
    intentionally takes no automated recovery action.
    """

    if action == "STOP":
        return "NOT_ATTEMPTED"

    base_probability = (
        FAILURE_PROFILES[
            failure_code
        ]["recovery_probability"]
    )

    actual_probability = base_probability

    # Retry can improve the chance of recovery
    if action == "RETRY":
        actual_probability += 0.08

    # Customer notification can sometimes result
    # in successful customer intervention
    elif action == "NOTIFY":
        actual_probability += 0.03

    # Escalation provides a smaller recovery opportunity
    elif action == "ESCALATE":
        actual_probability += 0.01

    actual_probability = max(
        0,
        min(1, actual_probability)
    )

    recovered = (
        random.random()
        < actual_probability
    )

    return (
        "SUCCESS"
        if recovered
        else "FAILED"
    )


# ---------------------------------------------------------
# Main generator
# ---------------------------------------------------------

def generate_dataset(
    num_transactions
):
    customers = create_customers()

    records = []

    start_time = (
        datetime.now()
        - timedelta(days=30)
    )

    for i in range(
        1,
        num_transactions + 1
    ):

        # Select an existing customer
        customer = random.choice(
            customers
        )

        failure_code = (
            choose_failure_code()
        )

        amount = choose_amount()

        payment_method = random.choice(
            PAYMENT_METHODS
        )

        retry_count = random.randint(
            0,
            2
        )

        predicted_probability, action = (
            calculate_prediction(
                failure_code,
                customer[
                    "customer_success_rate"
                ],
                retry_count,
            )
        )

        actual_outcome = (
            simulate_actual_outcome(
                failure_code,
                predicted_probability,
                action,
            )
        )

        # -------------------------------------------------
        # Revenue recovered by RecoverAI
        # -------------------------------------------------

        amount_recovered = (
            amount
            if actual_outcome == "SUCCESS"
            else 0
        )

        timestamp = (
            start_time
            + timedelta(
                minutes=random.randint(
                    0,
                    30 * 24 * 60,
                )
            )
        )

        records.append(
            {
                "transaction_ref":
                    f"SIM-TXN-{i:05d}",

                "customer_ref":
                    customer["customer_ref"],

                "customer_name":
                    customer["customer_name"],

                "customer_success_rate":
                    customer[
                        "customer_success_rate"
                    ],

                "amount":
                    amount,

                "payment_method":
                    payment_method,

                "failure_code":
                    failure_code,

                "retry_count":
                    retry_count,

                "predicted_recovery_probability":
                    predicted_probability,

                "recommended_action":
                    action,

                "actual_outcome":
                    actual_outcome,

                "amount_recovered":
                    amount_recovered,

                "timestamp":
                    timestamp,
            }
        )

    return pd.DataFrame(records)


# ---------------------------------------------------------
# Evaluation summary
# ---------------------------------------------------------

def print_summary(df):

    total_at_risk = (
        df["amount"].sum()
    )

    total_recovered = (
        df["amount_recovered"].sum()
    )

    recovery_rate = (
        total_recovered
        / total_at_risk
        * 100
        if total_at_risk > 0
        else 0
    )

    print("\n" + "=" * 60)
    print("RECOVERAI DATASET SUMMARY")
    print("=" * 60)

    print(
        f"Transactions: "
        f"{len(df)}"
    )

    print(
        f"Revenue at risk: "
        f"₹{total_at_risk:,.2f}"
    )

    print(
        f"Revenue recovered: "
        f"₹{total_recovered:,.2f}"
    )

    print(
        f"Recovery rate: "
        f"{recovery_rate:.2f}%"
    )

    print("\nActions:")

    print(
        df[
            "recommended_action"
        ].value_counts()
    )

    print("\nActual outcomes:")

    print(
        df[
            "actual_outcome"
        ].value_counts()
    )

    print("=" * 60)


# ---------------------------------------------------------
# Run
# ---------------------------------------------------------

if __name__ == "__main__":

    df = generate_dataset(
        NUM_TRANSACTIONS
    )

    output_path = (
        Path(__file__).parent
        / "data"
        / "synthetic_transactions.csv"
    )

    df.to_csv(
        output_path,
        index=False,
    )

    print(
        f"\nGenerated "
        f"{len(df)} transactions."
    )

    print(
        f"Saved to: "
        f"{output_path}"
    )

    print("\nPreview:")

    print(
        df[
            [
                "transaction_ref",
                "amount",
                "failure_code",
                "retry_count",
                "predicted_recovery_probability",
                "recommended_action",
                "actual_outcome",
                "amount_recovered",
            ]
        ].to_string(
            index=False
        )
    )

    print_summary(df)