const express = require("express");

const {
    analyzeTransaction
} = require("../services/aiService");

const router = express.Router();


router.post("/analyze", async (req, res) => {

    try {

        const result =
            await analyzeTransaction(
                req.body
            );

        res.json(result);

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});


module.exports = router;