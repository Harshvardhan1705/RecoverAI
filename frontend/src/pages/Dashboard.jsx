import { useEffect, useState } from "react";

import {
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  RefreshCw,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  getDashboardOverview,
  getRecentActions,
  getAuditLogs,
  getTransactions,
  analyzeTransaction,
  recoverTransaction,
} from "../api";

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  positive,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">
          {title}
        </p>

        <div className="rounded-xl bg-slate-100 p-2">
          <Icon
            size={19}
            className="text-slate-700"
          />
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <h3 className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </h3>

        <span
          className={`flex items-center gap-1 text-xs font-semibold ${
            positive
              ? "text-emerald-600"
              : "text-rose-600"
          }`}
        >
          {positive ? (
            <ArrowUpRight size={14} />
          ) : (
            <ArrowDownRight size={14} />
          )}

          {subtitle}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-400">
        Live data from RecoverAI
      </p>
    </div>
  );
}

// =====================================================
// HELPERS
// =====================================================

function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
}

function formatAction(action) {
  const labels = {
    RETRY: "Retry",
    NOTIFY: "Notify",
    ESCALATE: "Escalate",
    STOP: "Stop",
  };

  return labels[action] || action;
}

function formatFailureReason(code) {
  const labels = {
    BANK_TIMEOUT: "Bank timeout",
    BANK_ERROR: "Bank error",
    AUTH_FAILED: "Authentication failed",
    INSUFFICIENT_FUNDS: "Insufficient funds",
    UNKNOWN: "Unknown failure",
  };

  return labels[code] || code || "Unknown";
}

// =====================================================
// DASHBOARD
// =====================================================

function Dashboard() {
  const [overview, setOverview] = useState(null);

  const [actions, setActions] = useState([]);

  const [transactions, setTransactions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const [recommendationsOpen, setRecommendationsOpen] = useState(false);
  const [recommendationDetail, setRecommendationDetail] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // ===================================================
  // TRANSACTION ANALYSIS STATE
  // ===================================================

  const [selectedTransaction, setSelectedTransaction] =
    useState(null);

  const [analysis, setAnalysis] = useState(null);

  const [analysisLoading, setAnalysisLoading] =
    useState(false);

  const [analysisError, setAnalysisError] =
    useState("");

  const [recoveryLoading, setRecoveryLoading] =
    useState(false);

  const [recoveryResult, setRecoveryResult] =
    useState(null);

  const [recoveryError, setRecoveryError] =
    useState("");

  // ---------------------------------------------
  // Load dashboard data
  // ---------------------------------------------

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const [
          overviewResponse,
          actionsResponse,
          transactionsResponse,
          auditResponse,
        ] = await Promise.all([
          getDashboardOverview(),
          getRecentActions(),
          getTransactions(),
          getAuditLogs(),
        ]);

        if (overviewResponse.success) {
          setOverview(overviewResponse);
        }

        if (actionsResponse.success) {
          setActions(actionsResponse.actions || []);
        }

        if (transactionsResponse.success) {
          setTransactions(transactionsResponse.transactions || []);
        }

        if (auditResponse.success) {
          setAuditLogs(
            auditResponse.logs ||
              auditResponse.auditLogs ||
              []
          );
        }
      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err
        );

        setError(
          "Unable to load dashboard data. Make sure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // ===================================================
  // ANALYZE TRANSACTION
  // ===================================================

  const handleAnalyzeTransaction = async (action) => {
    try {
      setAnalysisLoading(true);
      setAnalysisError("");
      setAnalysis(null);
      setRecoveryResult(null);
      setRecoveryError("");

      setSelectedTransaction(action);

      const transactionId =
        action.transaction_id || action.id;

      const result = await analyzeTransaction(
        transactionId
      );

      if (result.success) {
        setAnalysis(result.analysis);
      } else {
        setAnalysisError(
          "Unable to analyze transaction."
        );
      }
    } catch (err) {
      console.error(
        "Transaction analysis error:",
        err
      );

      setAnalysisError(
        "Unable to analyze transaction. Make sure the backend and AI engine are running."
      );
    } finally {
      setAnalysisLoading(false);
    }
  };

  // ===================================================
  // REVIEW AI RECOMMENDATIONS
  // ===================================================

  const reviewQueue = transactions
    .filter((transaction) =>
      ["FAILED", "PENDING", "REVIEW"].includes(transaction.status)
    )
    .sort((a, b) => {
      const probabilityDifference =
        Number(b.recovery_probability || 0) -
        Number(a.recovery_probability || 0);

      if (probabilityDifference !== 0) {
        return probabilityDifference;
      }

      return Number(b.amount || 0) - Number(a.amount || 0);
    });

  const handleReviewRecommendation = (transaction) => {
    setRecommendationsOpen(false);
    setRecommendationDetail(transaction);
  };

  const openFullAnalysis = () => {
    if (!recommendationDetail) return;

    const transaction = recommendationDetail;
    setRecommendationDetail(null);
    handleAnalyzeTransaction({
      ...transaction,
      transaction_id: transaction.id,
    });
  };

  // ===================================================
  // EXECUTE RECOVERY
  // ===================================================

  const handleExecuteRecovery = async () => {
    if (!selectedTransaction || !analysis) return;

    try {
      setRecoveryLoading(true);
      setRecoveryError("");
      setRecoveryResult(null);

      const transactionId =
        selectedTransaction.transaction_id ||
        selectedTransaction.id;

      const result = await recoverTransaction(transactionId);

      if (result.success) {
        setRecoveryResult(result.recovery);

        const [
          overviewResponse,
          actionsResponse,
          transactionsResponse,
          auditResponse,
        ] = await Promise.all([
          getDashboardOverview(),
          getRecentActions(),
          getTransactions(),
          getAuditLogs(),
        ]);

        if (overviewResponse.success) {
          setOverview(overviewResponse);
        }

        if (actionsResponse.success) {
          setActions(actionsResponse.actions || []);
        }

        if (transactionsResponse.success) {
          setTransactions(transactionsResponse.transactions || []);
        }

        if (auditResponse.success) {
          setAuditLogs(
            auditResponse.logs ||
              auditResponse.auditLogs ||
              []
          );
        }
      } else {
        setRecoveryError(
          result.message || "Recovery execution failed."
        );
      }
    } catch (err) {
      console.error("Recovery execution error:", err);
      setRecoveryError(
        err.response?.data?.message ||
          "Unable to execute recovery. Make sure the backend and AI engine are running."
      );
    } finally {
      setRecoveryLoading(false);
    }
  };

  // ---------------------------------------------
  // Loading state
  // ---------------------------------------------

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <RefreshCw
            className="mx-auto animate-spin text-slate-700"
            size={28}
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading RecoverAI dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------
  // Error state
  // ---------------------------------------------

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle
            className="mx-auto text-rose-500"
            size={32}
          />

          <h2 className="mt-4 font-semibold text-slate-900">
            Dashboard unavailable
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>
        </div>
      </div>
    );
  }

  const data = overview?.overview || {};

  const actionCounts =
    overview?.actions || {};

  // ---------------------------------------------
  // Build chart data
  // ---------------------------------------------

  const revenueData = [
    {
      day: "Current",
      atRisk: Number(
        data.revenueAtRisk || 0
      ),
      recovered: Number(
        data.revenueRecovered || 0
      ),
    },
  ];

  // ---------------------------------------------
  // AI metrics
  // ---------------------------------------------

  const retryCount =
    Number(actionCounts.RETRY || 0);

  const notifyCount =
    Number(actionCounts.NOTIFY || 0);

  const escalateCount =
    Number(actionCounts.ESCALATE || 0);

  const stopCount =
    Number(actionCounts.STOP || 0);

  const totalAttention =
    Number(data.pendingTransactions || 0) +
    Number(data.reviewTransactions || 0) +
    Number(data.failedTransactions || 0);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* =========================================
          HEADER
      ========================================= */}

      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-20 items-center justify-between px-8">

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Revenue Recovery
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              AI-powered recovery intelligence for your payments
            </p>
          </div>

          <div className="flex items-center gap-3">

            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">

              <span className="h-2 w-2 rounded-full bg-emerald-500" />

              <span className="text-xs font-semibold text-emerald-700">
                AI Engine Active
              </span>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
              A
            </div>

          </div>
        </div>
      </header>

      <main className="space-y-6 p-8">

        {/* =========================================
            STATS
        ========================================= */}

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Revenue at Risk"
            value={formatCurrency(
              data.revenueAtRisk
            )}
            subtitle={`${
              data.failedTransactions || 0
            } failed`}
            icon={AlertTriangle}
            positive={false}
          />

          <StatCard
            title="Revenue Recovered"
            value={formatCurrency(
              data.revenueRecovered
            )}
            subtitle={`${
              data.successfulAttempts || 0
            } successful`}
            icon={CheckCircle2}
            positive={true}
          />

          <StatCard
            title="Recovery Rate"
            value={`${
              data.recoveryRate || 0
            }%`}
            subtitle={`${
              data.recoveredTransactions || 0
            } recovered`}
            icon={RefreshCw}
            positive={true}
          />

          <StatCard
            title="Recovery Attempts"
            value={
              data.totalRecoveryAttempts || 0
            }
            subtitle={`${
              data.blockedActions || 0
            } blocked`}
            icon={Clock3}
            positive={false}
          />

        </section>

        {/* =========================================
            CHART + AI RECOMMENDATION
        ========================================= */}

        <section className="grid gap-6 xl:grid-cols-3">

          {/* CHART */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-semibold text-slate-900">
                  Revenue Recovery Overview
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Live revenue at risk vs. recovered revenue
                </p>
              </div>

              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                Live
              </span>

            </div>

            <div className="mt-6 h-72">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <AreaChart data={revenueData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e2e8f0"
                  />

                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                  />

                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#94a3b8"
                    tickFormatter={(value) =>
                      `₹${value / 1000}k`
                    }
                  />

                  <Tooltip
                    formatter={(value) =>
                      `₹${Number(
                        value
                      ).toLocaleString(
                        "en-IN"
                      )}`
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="atRisk"
                    stroke="#64748b"
                    fill="#cbd5e1"
                    fillOpacity={0.25}
                    strokeWidth={2}
                    name="Revenue at Risk"
                  />

                  <Area
                    type="monotone"
                    dataKey="recovered"
                    stroke="#10b981"
                    fill="#6ee7b7"
                    fillOpacity={0.2}
                    strokeWidth={2}
                    name="Recovered"
                  />

                </AreaChart>

              </ResponsiveContainer>

            </div>

          </div>

          {/* =====================================
              AI CARD
          ===================================== */}

          <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-sm">

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  AI Recommendation
                </p>

                <h2 className="mt-2 text-lg font-semibold">
                  {totalAttention} payments need attention
                </h2>

              </div>

              <div className="rounded-xl bg-white/10 p-2">
                <AlertTriangle size={20} />
              </div>

            </div>

            <div className="mt-6 rounded-xl bg-white/10 p-4">

              <p className="text-sm leading-6 text-slate-300">

                {retryCount > 0
                  ? `${retryCount} transaction${
                      retryCount > 1
                        ? "s"
                        : ""
                    } currently have retry actions. RecoverAI recommends automated retry only when the safety engine allows it.`
                  : "No automated retry actions are currently recorded. Transactions requiring attention remain under controlled recovery policies."}

              </p>

            </div>

            <div className="mt-5 space-y-3">

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  Successful recovery attempts
                </span>

                <span className="font-semibold">
                  {data.successfulAttempts || 0}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  Blocked by safety engine
                </span>

                <span className="font-semibold">
                  {data.blockedActions || 0}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  Retry actions
                </span>

                <span className="font-semibold">
                  {retryCount}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  Manual escalation
                </span>

                <span className="font-semibold">
                  {escalateCount}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  Customer notifications
                </span>

                <span className="font-semibold">
                  {notifyCount}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  Stop decisions
                </span>

                <span className="font-semibold">
                  {stopCount}
                </span>
              </div>

            </div>

            <button
              onClick={() => setRecommendationsOpen(true)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Review AI Queue
              <ArrowUpRight size={16} />
            </button>

          </div>

        </section>

        {/* =========================================
            TRANSACTIONS REQUIRING ATTENTION
        ========================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 p-6">
            <div>
              <h2 className="font-semibold text-slate-900">
                Transactions Requiring Attention
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Analyze failed and pending payments before recovery
              </p>
            </div>

            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              {transactions.filter((transaction) =>
                ["FAILED", "PENDING", "REVIEW"].includes(transaction.status)
              ).length} active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-6 py-4 font-medium">Transaction</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Failure</th>
                  <th className="px-6 py-4 font-medium">Retries</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>

              <tbody>
                {transactions.filter((transaction) =>
                  ["FAILED", "PENDING", "REVIEW"].includes(transaction.status)
                ).length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-sm text-slate-400">
                      No transactions currently require attention.
                    </td>
                  </tr>
                ) : (
                  transactions
                    .filter((transaction) =>
                      ["FAILED", "PENDING", "REVIEW"].includes(transaction.status)
                    )
                    .slice(0, 8)
                    .map((transaction) => (
                      <tr
                        key={transaction.id}
                        onClick={() =>
                          handleAnalyzeTransaction({
                            ...transaction,
                            transaction_id: transaction.id,
                          })
                        }
                        className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-800">
                            {transaction.transaction_ref}
                          </span>
                          <p className="mt-1 text-xs text-slate-400">
                            {transaction.customer_name}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {formatCurrency(transaction.amount)}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-500">
                          {formatFailureReason(transaction.failure_code)}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {transaction.retry_count || 0} / 2
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* =========================================
            RECENT RECOVERY ACTIVITY
        ========================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex items-center justify-between border-b border-slate-200 p-6">

            <div>

              <h2 className="font-semibold text-slate-900">
                Recent Recovery Activity
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Latest AI-driven recovery decisions
              </p>

            </div>

            <button className="text-sm font-semibold text-slate-700 hover:text-slate-900">
              View all
            </button>

          </div>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead>

                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">

                  <th className="px-6 py-4 font-medium">
                    Transaction
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Amount
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Failure reason
                  </th>

                  <th className="px-6 py-4 font-medium">
                    AI action
                  </th>

                  <th className="px-6 py-4 font-medium">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {actions.length === 0 ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="px-6 py-10 text-center text-sm text-slate-400"
                    >
                      No recovery activity recorded yet.
                    </td>

                  </tr>

                ) : (

                  actions.map((action) => (

                    <tr
                      key={action.id}
                      onClick={() =>
                        handleAnalyzeTransaction(action)
                      }
                      className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50"
                    >

                      <td className="px-6 py-4">

                        <span className="text-sm font-semibold text-slate-800">
                          {action.transaction_ref}
                        </span>

                        <p className="mt-1 text-xs text-slate-400">
                          {action.customer_name}
                        </p>

                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-slate-700">
                        {formatCurrency(
                          action.amount
                        )}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatFailureReason(
                          action.failure_code ||
                            action.reason
                        )}
                      </td>

                      <td className="px-6 py-4">

                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">

                          {formatAction(
                            action.action_type
                          )}

                        </span>

                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            action.result ===
                            "SUCCESS"
                              ? "bg-emerald-50 text-emerald-700"
                              : action.result?.startsWith(
                                  "BLOCKED"
                                )
                              ? "bg-slate-100 text-slate-600"
                              : action.result ===
                                "FAILED"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >

                          {action.result ===
                          "SUCCESS"
                            ? "Recovered"
                            : action.result?.startsWith(
                                "BLOCKED"
                              )
                            ? "Blocked"
                            : action.result ===
                              "FAILED"
                            ? "Failed"
                            : action.result}

                        </span>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </section>

        {/* =========================================
            AUDIT TRAIL
        ========================================= */}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 p-6">
            <div>
              <h2 className="font-semibold text-slate-900">
                Audit Trail
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Traceable record of AI recovery decisions and executions
              </p>
            </div>

            <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
              {auditLogs.length} recent events
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                No audit events recorded yet.
              </div>
            ) : (
              auditLogs.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 rounded-lg p-2 ${
                        log.event_type === "RECOVERY_EXECUTED"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {log.event_type === "RECOVERY_EXECUTED" ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <AlertTriangle size={18} />
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {(log.event_type || "EVENT")
                          .replaceAll("_", " ")}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {log.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 text-left md:text-right">
                    <p className="text-xs font-semibold text-slate-700">
                      {log.transaction_ref || "Transaction"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {log.actor || "AI_ENGINE"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </main>

      {/* =========================================
          AI RECOMMENDATION QUEUE
      ========================================= */}
      {recommendationsOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  RecoverAI Operations
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  AI Recovery Queue
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Prioritized transactions requiring attention
                </p>
              </div>

              <button
                onClick={() => setRecommendationsOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6">
              {reviewQueue.length === 0 ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
                  <CheckCircle2 className="mx-auto text-emerald-600" size={32} />
                  <p className="mt-3 font-semibold text-slate-900">
                    No transactions require attention
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    RecoverAI has no active failed, pending, or review transactions in the current queue.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviewQueue.map((transaction) => {
                    const probability = Number(
                      transaction.recovery_probability || 0
                    );
                    const action =
                      transaction.ai_recommendation || "ANALYZE";
                    const automated = [
                      "BANK_TIMEOUT",
                      "BANK_ERROR",
                    ].includes(transaction.failure_code) &&
                      probability >= 70 &&
                      Number(transaction.retry_count || 0) < 2;

                    return (
                      <div
                        key={transaction.id}
                        className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-3">
                              <p className="font-semibold text-slate-900">
                                {transaction.transaction_ref}
                              </p>
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                {transaction.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-slate-500">
                              {transaction.customer_name || "Customer"} · {formatFailureReason(transaction.failure_code)}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              {formatCurrency(transaction.amount)}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-xs text-slate-400">
                                Recovery probability
                              </p>
                              <p className="text-lg font-bold text-slate-900">
                                {probability > 0 ? `${probability.toFixed(2)}%` : "Pending"}
                              </p>
                              <p className="text-xs font-medium text-slate-500">
                                {action !== "ANALYZE" ? formatAction(action) : "AI analysis needed"}
                                {automated ? " · Automated allowed" : " · Review required"}
                              </p>
                            </div>

                            <button
                              onClick={() => handleReviewRecommendation(transaction)}
                              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                              Review
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          AI RECOMMENDATION DETAIL MODAL
      ========================================= */}

      {recommendationDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  RecoverAI Decision Center
                </p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  AI Recommendation
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Why RecoverAI prioritized this transaction
                </p>
              </div>
              <button
                onClick={() => setRecommendationDetail(null)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div className="rounded-xl bg-slate-900 p-5 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Priority Transaction
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      {recommendationDetail.transaction_ref}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {recommendationDetail.customer_name || "Customer"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Amount</p>
                    <p className="mt-1 text-xl font-bold">
                      {formatCurrency(recommendationDetail.amount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    AI Recovery Probability
                  </p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {recommendationDetail.recovery_probability != null
                      ? `${Number(recommendationDetail.recovery_probability).toFixed(2)}%`
                      : "Analysis pending"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Model confidence signal
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Recommended Action
                  </p>
                  <p className="mt-2 text-lg font-bold text-slate-900">
                    {formatAction(recommendationDetail.ai_recommendation || "ANALYZE")}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Safety policy determines execution
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Recovery Signal
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {recommendationDetail.failure_code === "BANK_TIMEOUT"
                    ? "Temporary bank timeout detected. RecoverAI considers this a potentially recoverable payment failure."
                    : recommendationDetail.failure_code === "BANK_ERROR"
                    ? "Temporary bank error detected. RecoverAI is evaluating whether another controlled recovery attempt is worthwhile."
                    : recommendationDetail.failure_code === "AUTH_FAILED"
                    ? "Authentication failure detected. Customer intervention is generally more appropriate than repeated automated retries."
                    : recommendationDetail.failure_code === "INSUFFICIENT_FUNDS"
                    ? "Insufficient funds detected. Repeated automated attempts may create unnecessary payment friction."
                    : "This transaction requires additional review before an automated recovery decision is taken."}
                </p>
              </div>

              <div className={`rounded-xl border p-4 ${
                recommendationDetail.retry_count >= 2
                  ? "border-amber-200 bg-amber-50"
                  : "border-emerald-200 bg-emerald-50"
              }`}>
                <p className="text-sm font-semibold text-slate-900">
                  Safety Guardrail
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {recommendationDetail.retry_count >= 2
                    ? "Maximum retry limit reached. Automated recovery should remain blocked."
                    : "This transaction is still within the configured retry limit. The safety engine will decide whether automation is permitted."}
                </p>
              </div>

              <button
                onClick={openFullAnalysis}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Open Full AI Analysis
                <ArrowUpRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          TRANSACTION AI ANALYSIS MODAL
      ========================================= */}

      {(analysisLoading ||
        analysis ||
        analysisError) && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-6 backdrop-blur-sm">

          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">

            {/* Header */}

            <div className="flex items-center justify-between border-b border-slate-200 p-6">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  RecoverAI Intelligence
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  Transaction Analysis
                </h2>

              </div>

              <button
                onClick={() => {
                  setAnalysis(null);
                  setAnalysisError("");
                  setRecoveryResult(null);
                  setRecoveryError("");
                  setSelectedTransaction(null);
                }}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                Close
              </button>

            </div>

            {/* Loading */}

            {analysisLoading && (

              <div className="p-10 text-center">

                <RefreshCw
                  className="mx-auto animate-spin text-slate-700"
                  size={30}
                />

                <p className="mt-4 text-sm text-slate-500">
                  RecoverAI is analyzing this transaction...
                </p>

              </div>

            )}

            {/* Error */}

            {analysisError &&
              !analysisLoading && (

                <div className="p-8 text-center">

                  <AlertTriangle
                    className="mx-auto text-rose-500"
                    size={32}
                  />

                  <p className="mt-4 text-sm text-rose-600">
                    {analysisError}
                  </p>

                </div>

              )}

            {/* Analysis Result */}

            {analysis &&
              !analysisLoading && (

                <div className="space-y-6 p-6">

                  {/* Transaction */}

                  <div className="rounded-xl bg-slate-50 p-4">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-xs text-slate-400">
                          Transaction
                        </p>

                        <p className="mt-1 font-bold text-slate-900">
                          {analysis.transactionId}
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="text-xs text-slate-400">
                          Amount
                        </p>

                        <p className="mt-1 font-bold text-slate-900">
                          {formatCurrency(
                            selectedTransaction?.amount ||
                              analysis.customer?.amount
                          )}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* Probability */}

                  <div className="rounded-xl border border-slate-200 p-5">

                    <div className="flex items-center justify-between">

                      <div>

                        <p className="text-sm font-medium text-slate-500">
                          Recovery Probability
                        </p>

                        <p className="mt-1 text-3xl font-bold text-slate-900">
                          {
                            analysis.recoveryProbability
                          }
                          %
                        </p>

                      </div>

                      <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                        {formatAction(
                          analysis.recommendedAction
                        )}
                      </div>

                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">

                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{
                          width: `${Math.min(
                            Number(
                              analysis.recoveryProbability
                            ),
                            100
                          )}%`,
                        }}
                      />

                    </div>

                  </div>

                  {/* Decision */}

                  <div className="grid gap-4 md:grid-cols-2">

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Recommended Action
                      </p>

                      <p className="mt-2 text-lg font-bold text-slate-900">
                        {formatAction(
                          analysis.recommendedAction
                        )}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {analysis.reason}
                      </p>

                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">

                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Failure Analysis
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {analysis.failureAnalysis}
                      </p>

                    </div>

                  </div>

                  {/* Safety */}

                  <div
                    className={`rounded-xl border p-4 ${
                      analysis.safety
                        ?.automatedActionAllowed
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-amber-200 bg-amber-50"
                    }`}
                  >

                    <div className="flex items-center gap-2">

                      {analysis.safety
                        ?.automatedActionAllowed ? (

                        <CheckCircle2
                          size={19}
                          className="text-emerald-600"
                        />

                      ) : (

                        <AlertTriangle
                          size={19}
                          className="text-amber-600"
                        />

                      )}

                      <p className="font-semibold text-slate-900">
                        Safety Engine
                      </p>

                    </div>

                    <p className="mt-2 text-sm text-slate-600">

                      {analysis.safety
                        ?.automatedActionAllowed
                        ? "Automated recovery action is allowed."
                        : "Automated recovery action is blocked. Manual review is required."}

                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Retry count:{" "}
                      {
                        analysis.safety
                          ?.retryCount
                      }{" "}
                      /{" "}
                      {
                        analysis.safety
                          ?.maximumRetries
                      }
                    </p>

                  </div>

                  {/* Recovery Result / Action */}

                  {recoveryError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                      <p className="text-sm font-semibold text-rose-700">
                        Recovery failed
                      </p>
                      <p className="mt-1 text-sm text-rose-600">
                        {recoveryError}
                      </p>
                    </div>
                  )}

                  {recoveryResult && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={19} className="text-emerald-600" />
                        <p className="font-semibold text-emerald-800">
                          Recovery executed successfully
                        </p>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <div>
                          <p className="text-xs text-emerald-600">Result</p>
                          <p className="mt-1 text-sm font-bold text-emerald-800">
                            {recoveryResult.result}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-600">Attempt</p>
                          <p className="mt-1 text-sm font-bold text-emerald-800">
                            {recoveryResult.attemptNumber}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-600">Amount Recovered</p>
                          <p className="mt-1 text-sm font-bold text-emerald-800">
                            {formatCurrency(recoveryResult.amountRecovered)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!recoveryResult &&
                    !recoveryError &&
                    analysis.safety?.automatedActionAllowed &&
                    analysis.recommendedAction === "RETRY" && (
                      <button
                        onClick={handleExecuteRecovery}
                        disabled={recoveryLoading}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {recoveryLoading ? (
                          <>
                            <RefreshCw size={17} className="animate-spin" />
                            Executing Recovery...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={17} />
                            Execute Recovery
                          </>
                        )}
                      </button>
                    )}

                  {recoveryResult && (
                    <button
                      onClick={() => {
                        setAnalysis(null);
                        setAnalysisError("");
                        setRecoveryResult(null);
                        setRecoveryError("");
                        setSelectedTransaction(null);
                      }}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Close Analysis
                    </button>
                  )}

                </div>

              )}

          </div>

        </div>

      )}

    </div>
  );
}

export default Dashboard;