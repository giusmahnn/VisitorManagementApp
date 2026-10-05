const Visitors = require("../models/Visitors");
const User = require("../models/User");
const { Resend } = require("resend");
const QRCode = require("qrcode");
const { sendSuccess, sendError } = require("../utils/response");

const resend = new Resend(process.env.RESEND_API_KEY);

const errorMessage = (error) =>
  error instanceof Error ? error.message : "Unexpected server error.";

const validateVisitRange = (dateOfVisit, visitEndTime) => {
  const start = new Date(dateOfVisit);
  const end = new Date(visitEndTime);

  if (
    !dateOfVisit ||
    !visitEndTime ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start >= end
  ) {
    return null;
  }

  return { start, end };
};

const hasHostConflict = async (hostId, dateOfVisit, visitEndTime) => {
  if (!hostId) return false;

  const range = validateVisitRange(dateOfVisit, visitEndTime);
  if (!range) return false;

  return Boolean(
    await Visitors.exists({
      hostId,
      status: { $ne: "Rejected" },
      $or: [
        {
          dateOfVisit: { $lt: range.end },
          visitEndTime: { $gt: range.start },
        },
        {
          dateOfVisit: { $gte: range.start, $lt: range.end },
          $or: [{ visitEndTime: { $exists: false } }, { visitEndTime: null }],
        },
      ],
    }),
  );
};

const parseQrData = (qrDataString) => {
  if (!qrDataString) {
    return { error: "No QR code data provided." };
  }

  try {
    const parsedData = JSON.parse(qrDataString);

    if (!parsedData.visitorId) {
      return { error: "Visitor ID is missing from QR data." };
    }

    return { visitorId: parsedData.visitorId };
  } catch {
    return { error: "Invalid QR code format." };
  }
};

exports.getVisitors = async (req, res) => {
  try {
    const visitors = await Visitors.find();
    return sendSuccess(res, "Visitors retrieved successfully.", visitors);
  } catch (error) {
    return sendError(
      res,
      500,
      "Unable to retrieve visitors.",
      errorMessage(error),
    );
  }
};

exports.checkVisitor = async (req, res) => {
  try {
    const { mobileNo, dateOfVisit } = req.query;

    if (!mobileNo || !dateOfVisit) {
      return sendError(res, 400, "mobileNo and dateOfVisit are required.");
    }

    const visitors = await Visitors.find({ mobileNo, dateOfVisit });

    if (visitors.length === 0) {
      return sendError(
        res,
        404,
        "No visitor was found for the supplied mobile number and date.",
      );
    }

    return sendSuccess(res, "Visitor found successfully.", visitors);
  } catch (error) {
    return sendError(
      res,
      500,
      "Unable to check the visitor.",
      errorMessage(error),
    );
  }
};

exports.getVisitorsByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return sendError(res, 400, "startDate and endDate are required.");
    }

    const visitors = await Visitors.find({
      dateOfVisit: { $gte: startDate, $lte: endDate },
    });

    if (visitors.length === 0) {
      return sendError(
        res,
        404,
        "No visitors were found in the supplied date range.",
      );
    }

    return sendSuccess(res, "Visitor report retrieved successfully.", visitors);
  } catch (error) {
    return sendError(
      res,
      500,
      "Unable to retrieve the visitor report.",
      errorMessage(error),
    );
  }
};

exports.getReceptionistVisitors = async (req, res) => {
  try {
    const visitors = await Visitors.find().sort({
      dateOfVisit: 1,
      createdAt: -1,
    });
    return sendSuccess(
      res,
      "Reception visitor queue retrieved successfully.",
      visitors,
    );
  } catch (error) {
    return sendError(
      res,
      500,
      "Unable to retrieve the reception visitor queue.",
      errorMessage(error),
    );
  }
};

const findVisitorForReception = async (id) => Visitors.findById(id);

exports.manualCheckIn = async (req, res) => {
  try {
    const visitor = await findVisitorForReception(req.params.id);

    if (!visitor) return sendError(res, 404, "Visitor profile not found.");
    if (visitor.status === "Checked In")
      return sendError(res, 409, "Visitor is already checked in.");
    if (visitor.status === "Checked Out")
      return sendError(res, 409, "Visitor has already checked out.");
    if (visitor.status !== "Approved")
      return sendError(res, 403, "Only an approved visitor can check in.");

    const today = new Date();
    const scheduledDate = new Date(visitor.dateOfVisit);
    if (
      Number.isNaN(scheduledDate.getTime()) ||
      today.toDateString() !== scheduledDate.toDateString()
    ) {
      return sendError(
        res,
        400,
        "This appointment is not scheduled for today.",
      );
    }

    visitor.status = "Checked In";
    visitor.checkInTime = new Date();
    await visitor.save();
    return sendSuccess(
      res,
      `Check-in recorded for ${visitor.visitorName}.`,
      visitor,
    );
  } catch (error) {
    return sendError(res, 500, "Manual check-in failed.", errorMessage(error));
  }
};

exports.manualCheckOut = async (req, res) => {
  try {
    const visitor = await findVisitorForReception(req.params.id);

    if (!visitor) return sendError(res, 404, "Visitor profile not found.");
    if (visitor.status === "Checked Out")
      return sendError(res, 409, "Visitor has already checked out.");
    if (visitor.status !== "Checked In")
      return sendError(
        res,
        409,
        "Visitor must be checked in before checking out.",
      );

    visitor.status = "Checked Out";
    visitor.checkOutTime = new Date();
    await visitor.save();
    return sendSuccess(
      res,
      `Check-out recorded for ${visitor.visitorName}.`,
      visitor,
    );
  } catch (error) {
    return sendError(res, 500, "Manual check-out failed.", errorMessage(error));
  }
};

exports.createReceptionistBooking = async (req, res) => {
  try {
    const {
      visitorName,
      mobileNo,
      address,
      purpose,
      dateOfVisit,
      email,
      hostId,
    } = req.body;
    const { visitEndTime } = req.body;
    const host = await User.findOne({ _id: hostId, role: "host" });

    if (!host) return sendError(res, 400, "A valid host must be selected.");
    if (!visitorName || !mobileNo || !dateOfVisit || !email) {
      return sendError(
        res,
        400,
        "Visitor name, mobile number, date, and email are required.",
      );
    }

    if (!validateVisitRange(dateOfVisit, visitEndTime)) {
      return sendError(
        res,
        400,
        "A valid appointment start and end time are required.",
      );
    }

    if (await hasHostConflict(host._id, dateOfVisit, visitEndTime)) {
      return sendError(
        res,
        409,
        "That time is already booked for the selected host.",
      );
    }

    const visitor = await Visitors.create({
      visitorName,
      mobileNo,
      address,
      purpose,
      dateOfVisit,
      visitEndTime,
      email,
      hostId: host._id,
      whomToMeet: [host.name],
    });

    return sendSuccess(
      res,
      "Booking created and sent to the host for approval.",
      visitor,
      201,
    );
  } catch (error) {
    return sendError(
      res,
      400,
      "Unable to create receptionist booking.",
      errorMessage(error),
    );
  }
};

exports.getHostAppointments = async (req, res) => {
  try {
    const visitors = await Visitors.find({ hostId: req.user.id }).sort({
      dateOfVisit: 1,
    });
    return sendSuccess(
      res,
      "Host appointments retrieved successfully.",
      visitors,
    );
  } catch (error) {
    return sendError(
      res,
      500,
      "Unable to retrieve host appointments.",
      errorMessage(error),
    );
  }
};

exports.getHostNotifications = async (req, res) => {
  try {
    const notifications = await Visitors.find({
      hostId: req.user.id,
      status: "Pending Approval",
    }).sort({ createdAt: -1 });
    return sendSuccess(
      res,
      "Host notifications retrieved successfully.",
      notifications,
    );
  } catch (error) {
    return sendError(
      res,
      500,
      "Unable to retrieve host notifications.",
      errorMessage(error),
    );
  }
};

exports.createHostAppointment = async (req, res) => {
  try {
    const {
      visitorName,
      mobileNo,
      address,
      purpose,
      dateOfVisit,
      visitEndTime,
      email,
    } = req.body;
    const host = await User.findOne({ _id: req.user.id, role: "host" });

    if (!host) {
      return sendError(
        res,
        403,
        "Only host accounts can create host appointments.",
      );
    }

    if (!visitorName || !mobileNo || !dateOfVisit || !email) {
      return sendError(
        res,
        400,
        "Visitor name, mobile number, date, and email are required.",
      );
    }

    if (!validateVisitRange(dateOfVisit, visitEndTime)) {
      return sendError(
        res,
        400,
        "A valid appointment start and end time are required.",
      );
    }

    if (await hasHostConflict(host._id, dateOfVisit, visitEndTime)) {
      return sendError(
        res,
        409,
        "That time is already booked for your host account.",
      );
    }

    const visitor = await Visitors.create({
      visitorName,
      mobileNo,
      address,
      purpose,
      dateOfVisit,
      visitEndTime,
      email,
      hostId: host._id,
      whomToMeet: [host.name],
      status: "Approved",
    });

    return sendSuccess(
      res,
      "Appointment created for your host account.",
      visitor,
      201,
    );
  } catch (error) {
    return sendError(
      res,
      400,
      "Unable to create host appointment.",
      errorMessage(error),
    );
  }
};

exports.processHostDecision = async (req, res) => {
  try {
    const visitor = await Visitors.findOne({
      _id: req.params.id,
      hostId: req.user.id,
    });

    if (!visitor) {
      return sendError(res, 404, "Appointment not found for this host.");
    }

    if (visitor.status !== "Pending Approval") {
      return sendError(
        res,
        409,
        `This appointment is already ${visitor.status}.`,
      );
    }

    if (!["approve", "reject"].includes(req.body.decision)) {
      return sendError(res, 400, "Decision must be approve or reject.");
    }

    visitor.status = req.body.decision === "approve" ? "Approved" : "Rejected";
    await visitor.save();

    return sendSuccess(
      res,
      `Appointment ${visitor.status.toLowerCase()} successfully.`,
      visitor,
    );
  } catch (error) {
    return sendError(
      res,
      500,
      "Unable to process appointment decision.",
      errorMessage(error),
    );
  }
};

exports.createVisitor = async (req, res) => {
  try {
    const { hostId, dateOfVisit, visitEndTime } = req.body;
    const host = await User.findOne({ _id: hostId, role: "host" });

    if (!host) {
      return sendError(res, 400, "A valid host must be selected.");
    }

    if (!validateVisitRange(dateOfVisit, visitEndTime)) {
      return sendError(
        res,
        400,
        "A valid appointment start and end time are required.",
      );
    }

    if (await hasHostConflict(host._id, dateOfVisit, visitEndTime)) {
      return sendError(
        res,
        409,
        "That time range is already booked for the selected host.",
      );
    }

    const visitor = await Visitors.create({
      ...req.body,
      hostId: host._id,
      whomToMeet: [host.name],
    });
    let notificationMessage = "Host approval notification sent.";
    const backendUrl =
      process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
    const approveLink = `${backendUrl}/api/v1/visitors/approve/${visitor._id}`;
    const rejectLink = `${backendUrl}/api/v1/visitors/reject/${visitor._id}`;

    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: process.env.HOST_EMAIL || "adextoomuch@gmail.com",
        subject: `Action Required: Visit Request from ${visitor.visitorName}`,
        html: `
                    <h2>Hello Host,</h2>
                    <p>A visitor has requested an appointment to meet with you.</p>
                    <p><strong>Visitor Name:</strong> ${visitor.visitorName || "N/A"}</p>
                    <p><strong>Scheduled Date:</strong> ${visitor.dateOfVisit || "N/A"}</p>
                    <p><strong>Purpose:</strong> ${visitor.purpose || "N/A"}</p>
                    <p><strong>Mobile Number:</strong> ${visitor.mobileNo || "N/A"}</p>
                    <p><strong>Email:</strong> ${visitor.email || "N/A"}</p>
                    <p><strong>Whom To Meet:</strong> ${visitor.whomToMeet || "N/A"}</p>
                    <p><a href="${approveLink}">APPROVE VISIT</a></p>
                    <p><a href="${rejectLink}">REJECT VISIT</a></p>
                `,
      });
    } catch (emailError) {
      notificationMessage = "Host approval notification could not be sent.";
      console.error(
        "Failed to send host notification email:",
        errorMessage(emailError),
      );
    }

    return sendSuccess(
      res,
      `Registration received. Awaiting host approval. ${notificationMessage}`,
      visitor,
      201,
    );
  } catch (error) {
    return sendError(
      res,
      400,
      "Visitor registration failed.",
      errorMessage(error),
    );
  }
};

exports.scanCheckIn = async (req, res) => {
  try {
    const parsedQr = parseQrData(req.body.qrDataString);

    if (parsedQr.error) {
      return sendError(res, 400, parsedQr.error);
    }

    const visitor = await Visitors.findOne({ visitorId: parsedQr.visitorId });

    if (!visitor) {
      return sendError(res, 404, "Access denied: invalid digital pass.");
    }

    if (visitor.status === "Pending Approval") {
      return sendError(
        res,
        403,
        "Access denied: the visit is still awaiting host approval.",
      );
    }

    if (visitor.status === "Rejected") {
      return sendError(
        res,
        403,
        "Access denied: the visit was rejected by the host.",
      );
    }

    if (visitor.status === "Checked In") {
      return sendError(
        res,
        409,
        `Access denied: ${visitor.visitorName} is already checked in since ${visitor.checkInTime.toLocaleTimeString()}.`,
      );
    }

    if (visitor.status === "Checked Out") {
      return sendError(
        res,
        409,
        "Access denied: this visitor has already checked out.",
      );
    }

    const today = new Date();
    const scheduledDate = new Date(visitor.dateOfVisit);

    if (today.toDateString() !== scheduledDate.toDateString()) {
      return sendError(
        res,
        400,
        `Access denied: this appointment is scheduled for ${scheduledDate.toDateString()}, not today.`,
      );
    }

    visitor.status = "Checked In";
    visitor.checkInTime = new Date();
    await visitor.save();

    return sendSuccess(
      res,
      `Access granted. Welcome, ${visitor.visitorName}.`,
      visitor,
    );
  } catch (error) {
    return sendError(res, 500, "Check-in failed.", errorMessage(error));
  }
};

exports.scanCheckOut = async (req, res) => {
  try {
    const parsedQr = parseQrData(req.body.qrDataString);

    if (parsedQr.error) {
      return sendError(res, 400, parsedQr.error);
    }

    const visitor = await Visitors.findOne({ visitorId: parsedQr.visitorId });

    if (!visitor) {
      return sendError(res, 404, "Visitor profile not found.");
    }

    if (visitor.status === "Checked Out") {
      return sendError(
        res,
        409,
        `${visitor.visitorName} has already checked out since ${visitor.checkOutTime.toLocaleTimeString()}.`,
      );
    }

    if (visitor.status !== "Checked In") {
      return sendError(
        res,
        409,
        "Visitor must be checked in before checking out.",
      );
    }

    visitor.status = "Checked Out";
    visitor.checkOutTime = new Date();
    await visitor.save();

    return sendSuccess(
      res,
      `Check-out logged successfully for ${visitor.visitorName} at ${visitor.checkOutTime.toLocaleTimeString()}.`,
      visitor,
    );
  } catch (error) {
    return sendError(res, 500, "Check-out failed.", errorMessage(error));
  }
};

exports.processApproval = async (req, res) => {
  try {
    const visitor = await Visitors.findById(req.params.id);

    if (!visitor) {
      return sendError(res, 404, "Visitor profile not found.");
    }

    if (visitor.status !== "Pending Approval") {
      return sendError(
        res,
        409,
        `This request has already been processed. Current status: ${visitor.status}.`,
      );
    }

    if (!req.path.includes("/approve/")) {
      visitor.status = "Rejected";
      await visitor.save();
      return sendSuccess(res, "Visit request rejected successfully.", visitor);
    }

    visitor.status = "Approved";
    await visitor.save();

    const qrDataString = JSON.stringify({
      visitorId: visitor.visitorId,
      visitorName: visitor.visitorName,
      mobileNo: visitor.mobileNo,
      whomToMeet: visitor.whomToMeet,
      dateOfVisit: visitor.dateOfVisit,
      email: visitor.email,
    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrDataString);
    let notificationMessage = "Visitor access pass sent.";

    try {
      await resend.emails.send({
        from: "onboarding@resend.dev",
        to: process.env.VISITOR_EMAIL_OVERRIDE || visitor.email,
        subject: "Your Visitor Access Pass Is Approved",
        html: `
                    <h1>Congratulations ${visitor.visitorName}</h1>
                    <p>Your visit request has been approved.</p>
                    <p><strong>Visitor ID:</strong> ${visitor.visitorId}</p>
                    <img src="${qrCodeDataUrl}" alt="Access Pass QR" width="200" height="200" />
                `,
      });
    } catch (emailError) {
      notificationMessage =
        "Visitor approved, but the access pass could not be sent.";
      console.error("Failed to email QR pass:", errorMessage(emailError));
    }

    return sendSuccess(
      res,
      `Visit approved successfully. ${notificationMessage}`,
      visitor,
    );
  } catch (error) {
    return sendError(
      res,
      500,
      "Approval processing failed.",
      errorMessage(error),
    );
  }
};
