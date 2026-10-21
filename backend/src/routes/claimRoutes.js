const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");

const {
  createClaim,
  getMyClaims,
  cancelClaim,
  getAllClaims,
  approveClaim,
  rejectClaim,
  getReceipt,
} = require("../controllers/claimController");

const {
  verifyToken,
  verifyAdmin,
} = require("../middleware/authMiddleware");

router.get("/admin/all", verifyToken, verifyAdmin, getAllClaims);
router.patch("/:id/approve", verifyToken, verifyAdmin, approveClaim);
router.patch("/:id/reject", verifyToken, verifyAdmin, rejectClaim);

router.post("/", verifyToken, upload.array("receipts", 5), createClaim);
router.get("/", verifyToken, getMyClaims);
router.get("/receipts/:attachmentId",verifyToken, getReceipt);
router.patch("/:id/cancel", verifyToken, cancelClaim);

module.exports = router;