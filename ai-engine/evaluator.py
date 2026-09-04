from pathlib import Path

import pandas as pd


# ---------------------------------------------------------
# Load dataset
# ---------------------------------------------------------

DATA_PATH = (
    Path(__file__).parent
    / "data"
    / "synthetic_transactions.csv"
)


def load_data():
    if not DATA_PATH.exists():
        raise FileNotFoundError(
            f"Dataset not found: {DATA_PATH}"
        )

    return pd.read_csv(DATA_PATH)


# ---------------------------------------------------------
# Business Metrics
# ---------------------------------------------------------

def calculate_business_metrics(df):

    total_transactions = len(df)

    total_revenue_at_risk = (
        df["amount"].sum()
    )

    total_revenue_recovered = (
        df["amount_recovered"].sum()
    )

    recovery_rate = (
        total_revenue_recovered
        / total_revenue_at_risk
        * 100
        if total_revenue_at_risk > 0
        else 0
    )

    successful_recoveries = (
        (
            df["actual_outcome"]
            == "SUCCESS"
        )
        .sum()
    )

    failed_recoveries = (
        (
            df["actual_outcome"]
            == "FAILED"
        )
        .sum()
    )

    not_attempted = (
        (
            df["actual_outcome"]
            == "NOT_ATTEMPTED"
        )
        .sum()
    )

    return {
        "total_transactions":
            total_transactions,

        "revenue_at_risk":
            total_revenue_at_risk,

        "revenue_recovered":
            total_revenue_recovered,

        "recovery_rate":
            recovery_rate,

        "successful_recoveries":
            successful_recoveries,

        "failed_recoveries":
            failed_recoveries,

        "not_attempted":
            not_attempted,
    }


# ---------------------------------------------------------
# Action Metrics
# ---------------------------------------------------------

def calculate_action_metrics(df):

    results = {}

    actions = [
        "RETRY",
        "NOTIFY",
        "ESCALATE",
        "STOP",
    ]

    for action in actions:

        action_df = df[
            df["recommended_action"]
            == action
        ]

        count = len(action_df)

        successful = (
            (
                action_df["actual_outcome"]
                == "SUCCESS"
            )
            .sum()
        )

        failed = (
            (
                action_df["actual_outcome"]
                == "FAILED"
            )
            .sum()
        )

        success_rate = (
            successful
            / count
            * 100
            if count > 0
            else 0
        )

        revenue_recovered = (
            action_df[
                "amount_recovered"
            ].sum()
        )

        results[action] = {
            "count": count,
            "successful": successful,
            "failed": failed,
            "success_rate": success_rate,
            "revenue_recovered":
                revenue_recovered,
        }

    return results


# ---------------------------------------------------------
# Probability Calibration
# ---------------------------------------------------------

def calculate_probability_metrics(df):

    """
    Compare predicted recovery probability
    with actual recovery outcome.

    This is a simple calibration metric.

    A predicted probability of 80% means that,
    across similar transactions, we would expect
    roughly 80% to recover.
    """

    successful = (
        df["actual_outcome"]
        == "SUCCESS"
    )

    predicted_probability = (
        df[
            "predicted_recovery_probability"
        ]
        / 100
    )

    actual_probability = (
        successful.astype(int)
    )

    mean_absolute_error = (
        (
            predicted_probability
            - actual_probability
        )
        .abs()
        .mean()
        * 100
    )

    return {
        "mean_absolute_error":
            mean_absolute_error,

        "average_predicted_probability":
            predicted_probability.mean()
            * 100,

        "actual_recovery_rate":
            actual_probability.mean()
            * 100,
    }


# ---------------------------------------------------------
# Failure Analysis
# ---------------------------------------------------------

def calculate_failure_metrics(df):

    grouped = (
        df
        .groupby("failure_code")
        .agg(
            transactions=(
                "transaction_ref",
                "count"
            ),

            revenue_at_risk=(
                "amount",
                "sum"
            ),

            revenue_recovered=(
                "amount_recovered",
                "sum"
            ),

            average_probability=(
                "predicted_recovery_probability",
                "mean"
            ),
        )
        .reset_index()
    )

    grouped[
        "recovery_rate"
    ] = (
        grouped[
            "revenue_recovered"
        ]
        / grouped[
            "revenue_at_risk"
        ]
        * 100
    )

    return grouped


# ---------------------------------------------------------
# Print Report
# ---------------------------------------------------------

def print_report(
    business_metrics,
    action_metrics,
    probability_metrics,
    failure_metrics,
):

    print("\n")
    print("=" * 70)
    print("                 RECOVERAI EVALUATION REPORT")
    print("=" * 70)

    # -----------------------------------------------------
    # Business Impact
    # -----------------------------------------------------

    print("\nBUSINESS IMPACT")
    print("-" * 70)

    print(
        f"Transactions analyzed : "
        f"{business_metrics['total_transactions']:,}"
    )

    print(
        f"Revenue at risk       : "
        f"₹{business_metrics['revenue_at_risk']:,.2f}"
    )

    print(
        f"Revenue recovered     : "
        f"₹{business_metrics['revenue_recovered']:,.2f}"
    )

    print(
        f"Recovery rate         : "
        f"{business_metrics['recovery_rate']:.2f}%"
    )

    print(
        f"Successful recoveries : "
        f"{business_metrics['successful_recoveries']:,}"
    )

    print(
        f"Failed recoveries     : "
        f"{business_metrics['failed_recoveries']:,}"
    )

    print(
        f"Not attempted         : "
        f"{business_metrics['not_attempted']:,}"
    )

    # -----------------------------------------------------
    # Action Performance
    # -----------------------------------------------------

    print("\nACTION PERFORMANCE")
    print("-" * 70)

    for action, metrics in action_metrics.items():

        print(
            f"\n{action}"
        )

        print(
            f"  Transactions       : "
            f"{metrics['count']:,}"
        )

        print(
            f"  Successful         : "
            f"{metrics['successful']:,}"
        )

        print(
            f"  Failed             : "
            f"{metrics['failed']:,}"
        )

        print(
            f"  Success rate       : "
            f"{metrics['success_rate']:.2f}%"
        )

        print(
            f"  Revenue recovered  : "
            f"₹{metrics['revenue_recovered']:,.2f}"
        )

    # -----------------------------------------------------
    # Probability Quality
    # -----------------------------------------------------

    print("\nPROBABILITY QUALITY")
    print("-" * 70)

    print(
        f"Average predicted probability : "
        f"{probability_metrics['average_predicted_probability']:.2f}%"
    )

    print(
        f"Actual recovery rate          : "
        f"{probability_metrics['actual_recovery_rate']:.2f}%"
    )

    print(
        f"Probability MAE               : "
        f"{probability_metrics['mean_absolute_error']:.2f}%"
    )

    # -----------------------------------------------------
    # Failure Analysis
    # -----------------------------------------------------

    print("\nFAILURE TYPE ANALYSIS")
    print("-" * 70)

    print(
        failure_metrics.to_string(
            index=False,
            formatters={
                "revenue_at_risk":
                    "₹{:,.2f}".format,

                "revenue_recovered":
                    "₹{:,.2f}".format,

                "average_probability":
                    "{:.2f}%".format,

                "recovery_rate":
                    "{:.2f}%".format,
            },
        )
    )

    print("\n" + "=" * 70)


# ---------------------------------------------------------
# Main
# ---------------------------------------------------------

if __name__ == "__main__":

    print(
        "Loading RecoverAI dataset..."
    )

    df = load_data()

    business_metrics = (
        calculate_business_metrics(df)
    )

    action_metrics = (
        calculate_action_metrics(df)
    )

    probability_metrics = (
        calculate_probability_metrics(df)
    )

    failure_metrics = (
        calculate_failure_metrics(df)
    )

    print_report(
        business_metrics,
        action_metrics,
        probability_metrics,
        failure_metrics,
    )