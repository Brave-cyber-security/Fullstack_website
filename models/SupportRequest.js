const mongoose = require('mongoose');

const SupportRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
    default: 'Open'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  guestEmail: {
    type: String,
    required: function() {
      return this.isGuestRequest
    }
  },
  guestName: {
    type: String,
    default: "Guest User"
  },
  guestPhone: String,
  isGuestRequest: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('SupportRequest', SupportRequestSchema);
