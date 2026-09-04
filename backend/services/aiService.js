const axios = require("axios");

const AI_ENGINE_URL = "http://127.0.0.1:8000";

/**
 * Send a transaction to the RecoverAI
 * Python AI Engine.
 */
async function analyzeTransaction(transaction) {
    try {

        const response = await axios.post(
            `${AI_ENGINE_URL}/predict`,
            {
                transaction_id: transaction.transaction_id,
                amount: Number(transaction.amount),
                payment_method: transaction.payment_method,
                failure_code: transaction.failure_code,
                retry_count: Number(transaction.retry_count),
                customer_success_rate:
                    Number(transaction.customer_success_rate)
            }
        );

        return response.data;

    } catch (error) {

        console.error(
            "AI Engine Error:",
            error.message
        );

        throw new Error(
            "RecoverAI AI Engine is unavailable."
        );
    }
}

module.exports = {
    analyzeTransaction
};