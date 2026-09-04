const pool = require("../database/db");

const {
  analyzeTransaction,
} = require("../services/recoveryEngine");
const {
  analyzeTransaction: analyzeWithAI,
} = require("../services/aiService");
const analyzeTransactionById = async (req, res) => {

  try {

    const { id } = req.params;


    // -----------------------------------------------------
    // 1. Fetch transaction + customer data
    // -----------------------------------------------------

    const [rows] = await pool.query(
      `
      SELECT
        t.*,
        c.customer_ref,
        c.name AS customer_name,
        c.email AS customer_email,
        c.success_rate,
        c.total_transactions,
        c.successful_transactions,
        c.failed_transactions
      FROM transactions t
      JOIN customers c
        ON t.customer_id = c.id
      WHERE t.id = ?
      `,
      [id]
    );


    if (rows.length === 0) {

      return res.status(404).json({

        success: false,

        message:
          "Transaction not found",
      });
    }


    const transaction =
      rows[0];


    // -----------------------------------------------------
    // 2. Send transaction to Python AI Engine
    // -----------------------------------------------------

    const aiResult =
      await analyzeWithAI({

        transaction_id:
          transaction.transaction_ref,

        amount:
          Number(transaction.amount),

        payment_method:
          transaction.payment_method,

        failure_code:
          transaction.failure_code,

        retry_count:
          Number(transaction.retry_count),

        customer_success_rate:
          Number(transaction.success_rate),
      });


    // -----------------------------------------------------
    // 3. Apply Node safety / decision layer
    // -----------------------------------------------------

    const analysis =
      analyzeTransaction(
        transaction,
        aiResult.recoveryProbability
      );


    // -----------------------------------------------------
    // 4. Save AI result to MySQL
    // -----------------------------------------------------

    await pool.query(
      `
      UPDATE transactions
      SET
        recovery_probability = ?,
        ai_recommendation = ?
      WHERE id = ?
      `,
      [
        aiResult.recoveryProbability,
        analysis.recommendedAction,
        id,
      ]
    );


    // -----------------------------------------------------
    // 5. Return final analysis
    // -----------------------------------------------------

    res.json({

      success: true,

      analysis,

      customer: {

        customerRef:
          transaction.customer_ref,

        name:
          transaction.customer_name,

        email:
          transaction.customer_email,

        successRate:
          Number(transaction.success_rate),

        totalTransactions:
          transaction.total_transactions,

        successfulTransactions:
          transaction.successful_transactions,

        failedTransactions:
          transaction.failed_transactions,
      },

      ai: {

        model:
          "Random Forest",

        recoveryProbability:
          aiResult.recoveryProbability,
      },
    });

  } catch (error) {

    console.error(
      "AI analysis error:",
      error.message
    );


    res.status(500).json({

      success: false,

      message:
        "Failed to analyze transaction",

      error:
        error.message,
    });
  }
};

const getTransactions = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        t.id,
        t.transaction_ref,
        t.amount,
        t.payment_method,
        t.status,
        t.failure_code,
        t.failure_reason,
        t.retry_count,
        t.recovery_probability,
        t.ai_recommendation,
        t.created_at,
        c.customer_ref,
        c.name AS customer_name
      FROM transactions t
      JOIN customers c ON t.customer_id = c.id
      ORDER BY t.created_at DESC
    `);

    res.json({
      success: true,
      count: rows.length,
      transactions: rows,
    });
  } catch (error) {
    console.error("Get transactions error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `
      SELECT
        t.id,
        t.transaction_ref,
        t.amount,
        t.payment_method,
        t.status,
        t.failure_code,
        t.failure_reason,
        t.retry_count,
        t.recovery_probability,
        t.ai_recommendation,
        t.created_at,
        c.customer_ref,
        c.name AS customer_name,
        c.email AS customer_email
      FROM transactions t
      JOIN customers c ON t.customer_id = c.id
      WHERE t.id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.json({
      success: true,
      transaction: rows[0],
    });
  } catch (error) {
    console.error("Get transaction error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch transaction",
    });
  }
};

module.exports = {
  getTransactions,
  getTransactionById,
  analyzeTransactionById,
};