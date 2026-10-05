const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { Resend } = require("resend");
const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/response");

const resend = new Resend(process.env.RESEND_API_KEY);

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const generateTemporaryPassword = () => {
  const randomPart = crypto.randomBytes(9).toString("base64url");
  return `Vms-${randomPart}-9a`;
};

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const createHost = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name?.trim() || !email?.trim()) {
      return sendError(res, 400, "Host name and email are required.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return sendError(res, 409, "A user with this email already exists.");
    }

    const temporaryPassword = generateTemporaryPassword();
    console.log(
      `Generated temporary password for host ${normalizedEmail}: ${temporaryPassword}`,
    );
    const host = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(temporaryPassword, 12),
      role: "host",
    });

    let emailSent = false;

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: host.email,
        subject: "Your VisitorFlow host account",
        html: `
          <h2>Welcome to VisitorFlow, ${escapeHtml(host.name)}</h2>
          <p>An administrator created a host account for you.</p>
          <p><strong>Email:</strong> ${escapeHtml(host.email)}</p>
          <p><strong>Temporary password:</strong> ${escapeHtml(temporaryPassword)}</p>
          <p>Please sign in and change this password as soon as possible.</p>
        `,
      });
      emailSent = true;
    } catch (emailError) {
      console.error(
        "Failed to send host credentials email:",
        emailError.message,
      );
    }

    return sendSuccess(
      res,
      emailSent
        ? "Host created and credentials emailed successfully."
        : "Host created, but the credentials email could not be sent.",
      {
        host: publicUser(host),
        credentials: {
          email: host.email,
          temporaryPassword,
        },
        emailSent,
      },
      201,
    );
  } catch (error) {
    return sendError(res, 500, "Unable to create host.", error.message);
  }
};

const createReceptionist = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name?.trim() || !email?.trim()) {
      return sendError(res, 400, "Receptionist name and email are required.");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return sendError(res, 409, "A user with this email already exists.");
    }

    const temporaryPassword = generateTemporaryPassword();
    const receptionist = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(temporaryPassword, 12),
      role: "receptionist",
    });

    let emailSent = false;

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM || "onboarding@resend.dev",
        to: receptionist.email,
        subject: "Your VisitorFlow receptionist account",
        html: `
          <h2>Welcome to VisitorFlow, ${escapeHtml(receptionist.name)}</h2>
          <p>An administrator created a receptionist account for you.</p>
          <p><strong>Email:</strong> ${escapeHtml(receptionist.email)}</p>
          <p><strong>Temporary password:</strong> ${escapeHtml(temporaryPassword)}</p>
          <p>Please sign in and change this password as soon as possible.</p>
        `,
      });
      emailSent = true;
    } catch (emailError) {
      console.error(
        "Failed to send receptionist credentials email:",
        emailError.message,
      );
    }

    return sendSuccess(
      res,
      emailSent
        ? "Receptionist created and credentials emailed successfully."
        : "Receptionist created, but the credentials email could not be sent.",
      {
        receptionist: publicUser(receptionist),
        credentials: { email: receptionist.email, temporaryPassword },
        emailSent,
      },
      201,
    );
  } catch (error) {
    return sendError(
      res,
      500,
      "Unable to create receptionist.",
      error instanceof Error ? error.message : "Unexpected server error.",
    );
  }
};

const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const allowedRoles = ["admin", "host", "receptionist"];

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and role are required",
        data: null,
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
        data: null,
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
        data: null,
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
        data: null,
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      role,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to create user",
      data: null,
    });
  }
};

module.exports = { createUser, createHost, createReceptionist };
