const mongoose = require("mongoose");
const Counter = require("./Counter"); // Import the counter model

const visitorSchema = new mongoose.Schema(
  {
    visitorId: {
      type: String,
      unique: true,
    },

    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    visitorName: {
      type: String,
      required: [true, "Visitor name is required"],
    },

    mobileNo: {
      type: Number,
      required: [true, "Mobile No is required"],
    },

    address: {
      type: String,
    },

    whomToMeet: {
      type: [String],
      required: [true, "You must enter whom to meet"],
    },

    purpose: {
      type: String,
    },

    dateOfVisit: {
      type: Date,
    },

    visitEndTime: {
      type: Date,
    },

    email: {
      type: String,
      required: true,
    },

    // 1. ADDED STATUS FIELD: Tracks the visitor lifecycle stages
    status: {
      type: String,
      enum: [
        "Pending Approval",
        "Approved",
        "Rejected",
        "Checked In",
        "Checked Out",
      ],
      default: "Pending Approval",
    },

    // 2. ADDED CHECK-IN TIMESTAMP FIELD: Captures the exact moment they scan
    checkInTime: {
      type: Date,
    },
    // 3. ADD THIS NOW: Tracks the exact moment they leave
    checkOutTime: {
      type: Date,
    },
  },

  { timestamps: true }, // Date created and updated at
);

visitorSchema.pre("save", async function () {
  const doc = this;

  // Only generate a visitorId if one doesn't exist yet
  if (!doc.visitorId) {
    // Fixed the deprecation warning by changing 'new: true' to 'returnDocument: "after"'
    const counter = await Counter.findOneAndUpdate(
      { id: "visitorSequence" },
      { $inc: { seq: 1 } },
      { returnDocument: "after", upsert: true },
    );

    // This assigns your auto-generated code successfully
    doc.visitorId = `VID-${String(counter.seq).padStart(4, "0")}`;
  }
});

module.exports = mongoose.model("Visitors", visitorSchema);
