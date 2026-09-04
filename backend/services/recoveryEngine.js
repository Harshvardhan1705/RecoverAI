/**
 * RecoverAI - Recovery Decision Engine
 *
 * The Python AI Engine provides the recovery probability.
 * This module applies business and safety rules.
 *
 * IMPORTANT:
 * ML predicts.
 * This engine decides what action is allowed.
 */


// ---------------------------------------------------------
// Failure profiles
// ---------------------------------------------------------

const FAILURE_PROFILES = {

  BANK_TIMEOUT: {
    explanation:
      "Temporary bank timeout is often recoverable.",
  },

  BANK_ERROR: {
    explanation:
      "Temporary bank service issue may recover after a retry.",
  },

  AUTH_FAILED: {
    explanation:
      "Authentication failures generally require customer action.",
  },

  INSUFFICIENT_FUNDS: {
    explanation:
      "Insufficient funds should not be repeatedly retried.",
  },

  UNKNOWN: {
    explanation:
      "Unknown failure requires additional review.",
  },
};


// ---------------------------------------------------------
// Determine safe action
// ---------------------------------------------------------

function determineAction(
  transaction,
  recoveryProbability
) {

  /*
   * HARD SAFETY RULE
   *
   * Never automatically retry more than twice.
   */

  if (transaction.retry_count >= 2) {

    return {
      action: "STOP",

      reason:
        "Maximum retry limit reached. Automated retry stopped to prevent repeated payment attempts.",

      automatedActionAllowed: false,
    };
  }


  /*
   * HIGH CONFIDENCE
   *
   * Only temporary bank failures can be
   * automatically retried.
   */

  if (
    recoveryProbability >= 70 &&
    [
      "BANK_TIMEOUT",
      "BANK_ERROR",
    ].includes(transaction.failure_code)
  ) {

    return {
      action: "RETRY",

      reason:
        "High recovery probability and temporary bank failure detected.",

      automatedActionAllowed: true,
    };
  }


  /*
   * MEDIUM PROBABILITY
   */

  if (recoveryProbability >= 50) {

    return {
      action: "NOTIFY",

      reason:
        "Moderate recovery probability. Customer notification recommended before further recovery action.",

      automatedActionAllowed: false,
    };
  }


  /*
   * LOW PROBABILITY
   */

  return {

    action: "ESCALATE",

    reason:
      "Low recovery probability. Transaction should be reviewed manually.",

    automatedActionAllowed: false,
  };
}


// ---------------------------------------------------------
// Build final analysis
// ---------------------------------------------------------

function analyzeTransaction(
  transaction,
  recoveryProbability
) {

  const profile =
    FAILURE_PROFILES[
      transaction.failure_code
    ] ||
    FAILURE_PROFILES.UNKNOWN;


  const decision =
    determineAction(
      transaction,
      recoveryProbability
    );


  return {

    transactionId:
      transaction.transaction_ref,

    recoveryProbability:
      Number(
        recoveryProbability.toFixed(2)
      ),

    recommendedAction:
      decision.action,

    reason:
      decision.reason,

    failureAnalysis:
      profile.explanation,

    safety: {

      retryCount:
        transaction.retry_count,

      maximumRetries:
        2,

      automatedActionAllowed:
        decision.automatedActionAllowed,
    },
  };
}


module.exports = {

  analyzeTransaction,

  determineAction,
};