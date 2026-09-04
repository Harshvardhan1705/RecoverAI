const express = require("express");

const {
  getTransactions,
  getTransactionById,
  analyzeTransactionById,
} = require("../controllers/transactionController");

const router = express.Router();

router.get("/", getTransactions);
router.get("/:id/analyze", analyzeTransactionById);
router.get("/:id", getTransactionById);

module.exports = router;