const pool = require("../database/db");

// =====================================================
// GET DASHBOARD OVERVIEW
// =====================================================

const getOverview = async (req, res) => {
    try {

        // ---------------------------------------------
        // 1. Transaction overview
        // ---------------------------------------------

        const [transactionStats] = await pool.query(`
            SELECT
                COUNT(*) AS totalTransactions,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status IN ('FAILED', 'PENDING', 'REVIEW', 'STOPPED')
                            THEN amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS revenueAtRisk,

                COALESCE(
                    SUM(
                        CASE
                            WHEN status = 'RECOVERED'
                            THEN amount
                            ELSE 0
                        END
                    ),
                    0
                ) AS transactionRevenueRecovered,

                SUM(
                    CASE
                        WHEN status = 'RECOVERED'
                        THEN 1
                        ELSE 0
                    END
                ) AS recoveredTransactions,

                SUM(
                    CASE
                        WHEN status = 'FAILED'
                        THEN 1
                        ELSE 0
                    END
                ) AS failedTransactions,

                SUM(
                    CASE
                        WHEN status = 'PENDING'
                        THEN 1
                        ELSE 0
                    END
                ) AS pendingTransactions,

                SUM(
                    CASE
                        WHEN status = 'REVIEW'
                        THEN 1
                        ELSE 0
                    END
                ) AS reviewTransactions

            FROM transactions
        `);


        // ---------------------------------------------
        // 2. Recovery attempt statistics
        // ---------------------------------------------

        const [recoveryStats] = await pool.query(`
            SELECT

                COUNT(*) AS totalAttempts,

                SUM(
                    CASE
                        WHEN status = 'SUCCESS'
                        THEN 1
                        ELSE 0
                    END
                ) AS successfulAttempts,

                SUM(
                    CASE
                        WHEN status = 'FAILED'
                        THEN 1
                        ELSE 0
                    END
                ) AS failedAttempts,

                COALESCE(
                    SUM(amount_recovered),
                    0
                ) AS workflowRevenueRecovered

            FROM recovery_attempts
        `);


        // ---------------------------------------------
        // 3. Recovery action statistics
        // ---------------------------------------------

        const [actionRows] = await pool.query(`
            SELECT
                action_type AS action,
                COUNT(*) AS count
            FROM recovery_actions
            GROUP BY action_type
            ORDER BY count DESC
        `);


        // ---------------------------------------------
        // 4. Blocked action count
        // ---------------------------------------------

        const [blockedRows] = await pool.query(`
            SELECT
                COUNT(*) AS blockedActions
            FROM recovery_actions
            WHERE result LIKE 'BLOCKED%'
        `);


        const transactions = transactionStats[0];
        const recovery = recoveryStats[0];

        const revenueAtRisk =
            Number(transactions.revenueAtRisk);

        const revenueRecovered =
            Number(recovery.workflowRevenueRecovered);

        const totalRevenue =
            revenueAtRisk + revenueRecovered;


        // ---------------------------------------------
        // Recovery rate
        // ---------------------------------------------

        const recoveryRate =
            totalRevenue > 0
                ? (revenueRecovered / totalRevenue) * 100
                : 0;


        // ---------------------------------------------
        // Format action counts
        // ---------------------------------------------

        const actionCounts = {
            RETRY: 0,
            NOTIFY: 0,
            ESCALATE: 0,
            STOP: 0
        };

        actionRows.forEach((row) => {

            if (actionCounts[row.action] !== undefined) {
                actionCounts[row.action] =
                    Number(row.count);
            }

        });


        // ---------------------------------------------
        // Final response
        // ---------------------------------------------

        res.json({

            success: true,

            overview: {

                totalTransactions:
                    Number(transactions.totalTransactions),

                revenueAtRisk,

                revenueRecovered,

                recoveryRate:
                    Number(recoveryRate.toFixed(2)),

                recoveredTransactions:
                    Number(transactions.recoveredTransactions),

                failedTransactions:
                    Number(transactions.failedTransactions),

                pendingTransactions:
                    Number(transactions.pendingTransactions),

                reviewTransactions:
                    Number(transactions.reviewTransactions),

                successfulAttempts:
                    Number(recovery.successfulAttempts),

                failedAttempts:
                    Number(recovery.failedAttempts),

                totalRecoveryAttempts:
                    Number(recovery.totalAttempts),

                blockedActions:
                    Number(blockedRows[0].blockedActions)

            },

            actions: actionCounts

        });

    } catch (error) {

        console.error(
            "Dashboard overview error:",
            error.message
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch dashboard overview",

            error:
                error.message
        });
    }
};


// =====================================================
// GET RECENT RECOVERY ACTIONS
// =====================================================

const getRecentActions = async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT

                ra.id,

                ra.transaction_id,

                t.transaction_ref,

                t.amount,

                ra.action_type,

                ra.reason,

                ra.recovery_probability,

                ra.result,

                ra.executed_at,

                ra.created_at,

                c.name AS customer_name

            FROM recovery_actions ra

            JOIN transactions t
                ON ra.transaction_id = t.id

            JOIN customers c
                ON t.customer_id = c.id

            ORDER BY ra.created_at DESC

            LIMIT 10
        `);


        res.json({

            success: true,

            count: rows.length,

            actions: rows

        });

    } catch (error) {

        console.error(
            "Recent actions error:",
            error.message
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch recent recovery actions",

            error:
                error.message
        });
    }
};


// =====================================================
// GET AUDIT LOGS
// =====================================================

const getAuditLogs = async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT

                al.id,

                al.transaction_id,

                t.transaction_ref,

                al.event_type,

                al.description,

                al.actor,

                al.created_at

            FROM audit_logs al

            LEFT JOIN transactions t
                ON al.transaction_id = t.id

            ORDER BY al.created_at DESC

            LIMIT 20
        `);


        res.json({

            success: true,

            count: rows.length,

            logs: rows

        });

    } catch (error) {

        console.error(
            "Audit logs error:",
            error.message
        );

        res.status(500).json({

            success: false,

            message:
                "Failed to fetch audit logs",

            error:
                error.message
        });
    }
};


module.exports = {

    getOverview,
    getRecentActions,
    getAuditLogs

};