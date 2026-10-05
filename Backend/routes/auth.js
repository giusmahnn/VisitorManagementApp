const express = require("express");
const { login, bootstrapAdmin, me } = require("../controllers/authController");
const protect = require("../middlewares/authMiddleware");

const router = express.Router();

// Public registration is disabled. Accounts are created internally by admins.
// router.post("/register", register);
router.post("/login", login);
router.post("/bootstrap-admin", bootstrapAdmin);
router.get("/me", protect, me);

module.exports = router;
