
const express = require("express");
const router = express.Router();

const {
  setBudget,
  getBudgets,
} = require("../controllers/budgetController");

const {
  verifyToken,
  verifyAdmin,
} = require("../middleware/authMiddleware");

router.get("/", verifyToken, verifyAdmin, getBudgets);
router.put("/", verifyToken, verifyAdmin, setBudget);

module.exports = router;
