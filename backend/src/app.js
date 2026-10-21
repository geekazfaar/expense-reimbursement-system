
const express = require("express");
const cors = require("cors");
const pool = require ("./database/db");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const claimRoutes = require("./routes/claimRoutes");
const commentRoutes = require("./routes/commentRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/budgets", budgetRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Expense Reimbursement API is running",
  });
});

app.get("/api/db-test", async (req, res) => {
    try {
      const result = await pool.query("SELECT NOW()");
  
      res.status(200).json({
        success: true,
        message: "Database connected successfully",
        time: result.rows[0].now,
      });
    } catch (error) {
      console.error("Database test failed:", error.message);
  
      res.status(500).json({
        success: false,
        message: "Database connection failed",
      });
    }
  });

module.exports = app;