import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["info", "warning", "error", "success"],
    default: "info",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  relatedModel: {
    type: String,
    enum: ["SupportRequest", "User", "SparePart"],
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  readAt: {
    type: Date,
  },
})

// Method to mark notification as read
notificationSchema.methods.markAsRead = function () {
  this.isRead = true
  this.readAt = new Date()
  return this.save()
}

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 })
notificationSchema.index({ recipient: 1, isRead: 1 })

export default mongoose.model("Notification", notificationSchema)
