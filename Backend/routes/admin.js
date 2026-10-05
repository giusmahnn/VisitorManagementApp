const express = require("express");

const {
  createUser,
  createHost,
  createReceptionist,
} = require("../controllers/adminController");

const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const router = express.Router();

router.post("/users", protect, authorize("admin"), createUser);

router.post("/hosts", protect, authorize("admin"), createHost);
router.post("/receptionists", protect, authorize("admin"), createReceptionist);

module.exports = router;
