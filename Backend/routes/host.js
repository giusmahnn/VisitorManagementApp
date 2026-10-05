const express = require("express");

const { getHosts, getHostById } = require("../controllers/hostController");
const {
  getHostAppointments,
  getHostNotifications,
  createHostAppointment,
  processHostDecision,
} = require("../controllers/Visitors");

const protect = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/public", getHosts);
router.get("/", protect, getHosts);

router.get("/me/appointments", protect, getHostAppointments);
router.get("/me/notifications", protect, getHostNotifications);
router.post("/me/appointments", protect, createHostAppointment);
router.patch("/me/appointments/:id/decision", protect, processHostDecision);

router.get("/:id", protect, getHostById);

module.exports = router;
