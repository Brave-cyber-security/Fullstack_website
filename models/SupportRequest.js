const mongoose = require("mongoose")

const SupportRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Making it optional for guest requests
  },
  requestType: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["Open", "In Progress", "Resolved", "Closed"],
    default: "Open",
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // Guest request fields
  guestEmail: {
    type: String,
    required: function () {
      return this.isGuestRequest
    },
  },
  guestName: {
    type: String,
    default: "Guest User",
  },
  guestPhone: String,
  isGuestRequest: {
    type: Boolean,
    default: false,
  },
  estimatedCost: {
    type: Number,
    default: 0,
  },
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Assuming technicians are also users
  },
  resolutionNotes: {
    type: String,
  },
})

module.exports = mongoose.model("SupportRequest", SupportRequestSchema)
