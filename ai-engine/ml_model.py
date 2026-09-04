from pathlib import Path

import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from decision_engine import make_recovery_decision


# ---------------------------------------------------------
# Configuration
# ---------------------------------------------------------

DATA_PATH = (
    Path(__file__).parent
    / "data"
    / "synthetic_transactions.csv"
)

RANDOM_STATE = 42


# ---------------------------------------------------------
# Load data
# ---------------------------------------------------------

def load_data():

    df = pd.read_csv(DATA_PATH)

    return df


# ---------------------------------------------------------
# Prepare training data
# ---------------------------------------------------------

def prepare_data(df):

    # Only transactions with observed outcomes
    observed = df[
        df["actual_outcome"].isin(
            ["SUCCESS", "FAILED"]
        )
    ].copy()

    observed["target"] = (
        observed["actual_outcome"]
        == "SUCCESS"
    ).astype(int)

    features = [
        "amount",
        "payment_method",
        "failure_code",
        "retry_count",
        "customer_success_rate",
    ]

    X = observed[features]

    y = observed["target"]

    return X, y


# ---------------------------------------------------------
# Build model
# ---------------------------------------------------------

def build_model():

    numeric_features = [
        "amount",
        "retry_count",
        "customer_success_rate",
    ]

    categorical_features = [
        "payment_method",
        "failure_code",
    ]

    preprocessor = ColumnTransformer(
        transformers=[
            (
                "numeric",
                "passthrough",
                numeric_features,
            ),
            (
                "categorical",
                OneHotEncoder(
                    handle_unknown="ignore"
                ),
                categorical_features,
            ),
        ]
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_leaf=5,
        random_state=RANDOM_STATE,
        class_weight="balanced",
    )

    pipeline = Pipeline(
        steps=[
            (
                "preprocessor",
                preprocessor,
            ),
            (
                "classifier",
                model,
            ),
        ]
    )

    return pipeline


# ---------------------------------------------------------
# Train model
# ---------------------------------------------------------

def train_model():

    df = load_data()

    X, y = prepare_data(df)

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.20,
            random_state=RANDOM_STATE,
            stratify=y,
        )
    )

    model = build_model()

    model.fit(
        X_train,
        y_train,
    )

    return model


# ---------------------------------------------------------
# Predict recovery
# ---------------------------------------------------------

def predict_recovery(
    model,
    transaction,
):

    transaction_df = pd.DataFrame(
        [
            {
                "amount":
                    transaction["amount"],

                "payment_method":
                    transaction["payment_method"],

                "failure_code":
                    transaction["failure_code"],

                "retry_count":
                    transaction["retry_count"],

                "customer_success_rate":
                    transaction[
                        "customer_success_rate"
                    ],
            }
        ]
    )

    probability = (
        model.predict_proba(
            transaction_df
        )[0][1]
        * 100
    )

    decision = make_recovery_decision(
        recovery_probability=probability,

        failure_code=
            transaction["failure_code"],

        retry_count=
            transaction["retry_count"],

        amount=
            transaction["amount"],
    )

    return decision


# ---------------------------------------------------------
# Test inference
# ---------------------------------------------------------

if __name__ == "__main__":

    print(
        "Training RecoverAI ML model..."
    )

    model = train_model()

    print(
        "Model trained successfully."
    )

    print("\n")
    print("=" * 70)
    print("             RECOVERAI LIVE INFERENCE")
    print("=" * 70)

    test_transactions = [

        {
            "transaction_id": "LIVE-001",
            "amount": 2500,
            "payment_method": "UPI",
            "failure_code": "BANK_TIMEOUT",
            "retry_count": 0,
            "customer_success_rate": 92,
        },

        {
            "transaction_id": "LIVE-002",
            "amount": 8500,
            "payment_method": "CARD",
            "failure_code": "AUTH_FAILED",
            "retry_count": 1,
            "customer_success_rate": 45,
        },

        {
            "transaction_id": "LIVE-003",
            "amount": 12000,
            "payment_method": "NETBANKING",
            "failure_code": "UNKNOWN",
            "retry_count": 2,
            "customer_success_rate": 95,
        },
    ]

    for transaction in test_transactions:

        decision = predict_recovery(
            model,
            transaction,
        )

        print(
            f"\nTransaction: "
            f"{transaction['transaction_id']}"
        )

        print(
            f"Amount: "
            f"₹{transaction['amount']:,.2f}"
        )

        print(
            f"Failure: "
            f"{transaction['failure_code']}"
        )

        print(
            f"Customer success rate: "
            f"{transaction['customer_success_rate']}%"
        )

        print(
            f"ML recovery probability: "
            f"{decision.probability:.2f}%"
        )

        print(
            f"Recommended action: "
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

    print("\n" + "=" * 70)