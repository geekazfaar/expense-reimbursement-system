const express = require("express");
const router = express.Router();

const { addComment,getComments, } = require("../controllers/commentController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/:id", verifyToken, addComment);
router.get("/:id", verifyToken, getComments);

module.exports = router;