const express = require("express");
const cors = require("cors");
require("dotenv").config();
const aiRoutes = require("./routes/aiRoutes");

const pool = require("./database/db");
const transactionRoutes = require("./routes/transactionRoutes");
const recoveryRoutes = require("./routes/recoveryRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/transactions", transactionRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/transactions", recoveryRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/health", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS connected");

    res.json({
      success: true,
      message: "RecoverAI backend is running",
      database: rows[0].connected === 1 ? "connected" : "disconnected",
    });
  } catch (error) {
    console.error("Database error:", error.message);

    res.status(500).json({
      success: false,
      message: "Backend is running but database connection failed",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`RecoverAI backend running on http://localhost:${PORT}`);
});