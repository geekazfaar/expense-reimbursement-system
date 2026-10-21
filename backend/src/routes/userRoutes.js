
const express = require("express");
const router = express.Router();

const {
    getProfile,
    updateProfile,
    getEmployees,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
  } = require("../controllers/userController");

  const {
    verifyToken,
    verifyAdmin,
  } = require("../middleware/authMiddleware");

router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.get("/", verifyToken, verifyAdmin, getEmployees);
router.post("/", verifyToken, verifyAdmin, createEmployee);
router.put("/:id", verifyToken, verifyAdmin, updateEmployee);
router.patch("/:id/deactivate", verifyToken , verifyAdmin , deactivateEmployee);

module.exports = router;
