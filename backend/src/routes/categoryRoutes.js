
const express = require("express");
const router = express.Router();

const {
  getCategories,
  createCategory,
  updateCategory,
} = require("../controllers/categoryController");

const {
  verifyToken,
  verifyAdmin,
} = require("../middleware/authMiddleware");

router.get("/", verifyToken, getCategories);


router.post("/", verifyToken, verifyAdmin, createCategory);
router.put("/:id", verifyToken, verifyAdmin, updateCategory);

module.exports = router;
