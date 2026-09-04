const express = require("express");

const {
    recoverTransaction
} = require("../controllers/recoveryController");

const router = express.Router();

router.post("/:id/recover", recoverTransaction);

module.exports = router;