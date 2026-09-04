const pool = require("../database/db");
const {
    analyzeTransaction: analyzeWithAI
} = require("../services/aiService");

const {
    analyzeTransaction
} = require("../services/recoveryEngine");

async function recoverTransaction(req, res) {
    const transactionId = req.params.id;

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get transaction + customer information
        const [rows] = await connection.query(
            `
            SELECT
                t.*,
                c.customer_ref,
                c.name AS customer_name,
                c.email,
                c.success_rate
            FROM transactions t
            JOIN customers c ON t.customer_id = c.id
            WHERE t.id = ?
            FOR UPDATE
            `,
            [transactionId]
        );

        if (rows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                success: false,
                message: "Transaction not found."
            });
        }

        const transaction = rows[0];

        if (transaction.status === "RECOVERED") {
            await connection.rollback();

            return res.status(400).json({
                success: false,
                message: "Transaction has already been recovered. Duplicate recovery is not allowed."
            });
        }

        // 2. Ask Python AI for recovery probability
        const aiResult = await analyzeWithAI({
            transaction_id: transaction.transaction_ref,
            amount: Number(transaction.amount),
            payment_method: transaction.payment_method,
            failure_code: transaction.failure_code,
            retry_count: Number(transaction.retry_count),
            customer_success_rate: Number(transaction.success_rate)
        });

        // 3. Node.js decision engine applies safety rules
        const analysis = analyzeTransaction(
            transaction,
            Number(aiResult.recoveryProbability)
        );

        // 4. Save latest AI decision
        await connection.query(
            `
            UPDATE transactions
            SET recovery_probability = ?,
                ai_recommendation = ?
            WHERE id = ?
            `,
            [
                analysis.recoveryProbability,
                analysis.recommendedAction,
                transactionId
            ]
        );

        // 5. Record the recovery action
        const [actionResult] = await connection.query(
            `
            INSERT INTO recovery_actions
            (
                transaction_id,
                action_type,
                reason,
                recovery_probability,
                executed_at,
                result
            )
            VALUES (?, ?, ?, ?, NOW(), ?)
            `,
            [
                transactionId,
                analysis.recommendedAction,
                analysis.reason,
                analysis.recoveryProbability,
                "PENDING"
            ]
        );

        const actionId = actionResult.insertId;

        // 6. If automation is NOT allowed, stop safely
        if (!analysis.safety.automatedActionAllowed) {

            await connection.query(
                `
                UPDATE recovery_actions
                SET result = ?
                WHERE id = ?
                `,
                [
                    `BLOCKED_${analysis.recommendedAction}`,
                    actionId
                ]
            );

            await connection.query(
                `
                INSERT INTO audit_logs
                (
                    transaction_id,
                    event_type,
                    description,
                    actor
                )
                VALUES (?, ?, ?, ?)
                `,
                [
                    transactionId,
                    "RECOVERY_BLOCKED",
                    `Automated ${analysis.recommendedAction} blocked by safety policy.`,
                    "AI_ENGINE"
                ]
            );

            await connection.commit();

            return res.json({
                success: true,
                transactionId: transaction.transaction_ref,
                recovery: {
                    executed: false,
                    action: analysis.recommendedAction,
                    result: "BLOCKED",
                    amountRecovered: 0
                },
                analysis
            });
        }

        // 7. Simulate RETRY
        const attemptNumber = Number(transaction.retry_count) + 1;

        // Deterministic simulation:
        // High probability transactions succeed more often.
        const success =
            Number(aiResult.recoveryProbability) >= 70;

        const attemptStatus = success ? "SUCCESS" : "FAILED";

        const amountRecovered = success
            ? Number(transaction.amount)
            : 0;

        // 8. Insert recovery attempt
        await connection.query(
            `
            INSERT INTO recovery_attempts
            (
                transaction_id,
                attempt_number,
                action_type,
                status,
                amount_recovered
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                transactionId,
                attemptNumber,
                "RETRY",
                attemptStatus,
                amountRecovered
            ]
        );

        // 9. Update transaction
        if (success) {
            await connection.query(
                `
                UPDATE transactions
                SET status = 'RECOVERED',
                    retry_count = ?,
                    recovery_probability = ?,
                    ai_recommendation = 'RETRY'
                WHERE id = ?
                `,
                [
                    attemptNumber,
                    aiResult.recoveryProbability,
                    transactionId
                ]
            );
        } else {
            await connection.query(
                `
                UPDATE transactions
                SET status = 'FAILED',
                    retry_count = ?,
                    recovery_probability = ?,
                    ai_recommendation = 'RETRY'
                WHERE id = ?
                `,
                [
                    attemptNumber,
                    aiResult.recoveryProbability,
                    transactionId
                ]
            );
        }

        // 10. Update recovery action
        await connection.query(
            `
            UPDATE recovery_actions
            SET result = ?
            WHERE id = ?
            `,
            [
                attemptStatus,
                actionId
            ]
        );

        // 11. Create audit log
        await connection.query(
            `
            INSERT INTO audit_logs
            (
                transaction_id,
                event_type,
                description,
                actor
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                transactionId,
                "RECOVERY_EXECUTED",
                `Simulated RETRY ${attemptStatus}. Amount recovered: ₹${amountRecovered.toFixed(2)}.`,
                "AI_ENGINE"
            ]
        );

        await connection.commit();

        // 12. Return result
        return res.json({
            success: true,
            transactionId: transaction.transaction_ref,

            recovery: {
                executed: true,
                action: "RETRY",
                result: attemptStatus,
                attemptNumber,
                amountRecovered
            },

            analysis,

            ai: {
                model: "Random Forest",
                recoveryProbability: aiResult.recoveryProbability
            }
        });

    } catch (error) {

        await connection.rollback();

        console.error("Recovery Error:", error);

        return res.status(500).json({
            success: false,
            message: "Recovery workflow failed.",
            error: error.message
        });

    } finally {
        connection.release();
    }
}

module.exports = {
    recoverTransaction
};