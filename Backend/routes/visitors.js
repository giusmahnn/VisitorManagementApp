const express = require("express");
const router = express.Router();

// 1. Import your new security limiters from the middleware folder
const {
  registrationLimiter,
  generalApiLimiter,
} = require("../middlewares/rateLimiter");

// Make sure the names inside the curly braces match your controller exactly!
const {
  getVisitors,
  createVisitor,
  checkVisitor,
  getVisitorsByDate,
  scanCheckIn,
  scanCheckOut,
  processApproval,
  getReceptionistVisitors,
  manualCheckIn,
  manualCheckOut,
  createReceptionistBooking,
} = require("../controllers/Visitors");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

// 2. Protect ALL routes in this file with the standard API limiter (prevents aggressive clicking)
router.use(generalApiLimiter);

router.get("/", getVisitors);

// 3. Attach the strict registrationLimiter specifically to the creation POST route
router.post("/", registrationLimiter, createVisitor);

// Web links triggered directly by clicking buttons inside the Host's email body
router.get("/approve/:id", processApproval);
router.get("/reject/:id", processApproval);

router.route("/checkUser").get(checkVisitor); // To check if a visitor exists
router.route("/report").get(getVisitorsByDate); // To search visitor by date start and end

router.get(
  "/reception/visitors",
  protect,
  authorize("receptionist"),
  getReceptionistVisitors,
);
router.post(
  "/reception/bookings",
  protect,
  authorize("receptionist"),
  createReceptionistBooking,
);
router.patch(
  "/reception/visitors/:id/check-in",
  protect,
  authorize("receptionist"),
  manualCheckIn,
);
router.patch(
  "/reception/visitors/:id/check-out",
  protect,
  authorize("receptionist"),
  manualCheckOut,
);

// 4. Clean paths for scanning (Removed the redundant '/visitors' prefix)
router.post("/scan-checkin", protect, authorize("receptionist"), scanCheckIn);
router.post("/scan-checkout", protect, authorize("receptionist"), scanCheckOut);

module.exports = router;
