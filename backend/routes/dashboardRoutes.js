const express = require("express");

const {
    getOverview,
    getRecentActions,
    getAuditLogs
} = require("../controllers/dashboardController");

const router = express.Router();


// Dashboard overview
router.get("/overview", getOverview);


// Recent recovery actions
router.get("/recent-actions", getRecentActions);


// Audit logs
router.get("/audit-logs", getAuditLogs);


module.exports = router;