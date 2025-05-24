const express = require("express")
const router = express.Router()
const SupportRequest = require("../models/SupportRequest")
const User = require("../models/User")
const Notification = require("../models/Notification")
const { authenticateToken } = require("../middleware/auth")

// Update the submit support request route
router.post("/support", async (req, res) => {
  try {
    const { title, description, deviceType, urgency, location } = req.body

    // Validate input
    if (!title || !description || !deviceType || !urgency) {
      return res.render("customer/support-form", {
        error: "All required fields must be filled",
        ...req.body,
      })
    }

    // Create support request
    const supportRequest = new SupportRequest({
      customer: req.session.user,
      title,
      description,
      deviceType,
      urgency,
      location,
      status: "pending",
      approvalStatus: "pending_approval",
    })

    // Calculate estimated cost
    supportRequest.estimatedCost = supportRequest.calculateEstimatedCost()

    await supportRequest.save()

    // Create notifications for masters
    const masters = await User.find({ isMaster: true })
    for (const master of masters) {
      const notification = new Notification({
        recipient: master._id,
        title: "New Support Request Requires Approval",
        message: `A new ${supportRequest.urgency} priority request for ${supportRequest.deviceType} needs your approval.`,
        type: "info",
        relatedModel: "SupportRequest",
        relatedId: supportRequest._id,
      })
      await notification.save()
    }

    res.redirect(`/customer/support/${supportRequest._id}`)
  } catch (error) {
    console.error("Support request error:", error)
    res.render("customer/support-form", {
      error: "An error occurred while submitting your request",
      ...req.body,
    })
  }
})

// Route to get all support requests for a customer
router.get("/support-requests", authenticateToken, async (req, res) => {
  try {
    const supportRequests = await SupportRequest.find({ customer: req.user._id })
    res.status(200).json(supportRequests)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to fetch support requests.", error: error.message })
  }
})

// Route to get a specific support request by ID for a customer
router.get("/support-requests/:id", authenticateToken, async (req, res) => {
  try {
    const supportRequest = await SupportRequest.findOne({ _id: req.params.id, customer: req.user._id })

    if (!supportRequest) {
      return res.status(404).json({ message: "Support request not found." })
    }

    res.status(200).json(supportRequest)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to fetch support request.", error: error.message })
  }
})

// Add route to view notifications
router.get("/notifications", async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.session.user }).sort({ createdAt: -1 }).limit(20)

    res.render("customer/notifications", { notifications })
  } catch (error) {
    console.error("Notifications error:", error)
    res.status(500).render("error", { error: "Error loading notifications" })
  }
})

// Add route to mark notification as read
router.post("/notifications/:id/read", async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.session.user,
    })

    if (notification) {
      await notification.markAsRead()
    }

    res.redirect("/customer/notifications")
  } catch (error) {
    console.error("Mark notification read error:", error)
    res.status(500).render("error", { error: "Error marking notification as read" })
  }
})

module.exports = router
