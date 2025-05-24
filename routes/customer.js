import express from "express"
import SupportRequest from "../models/SupportRequest.js"
import User from "../models/User.js"
import Notification from "../models/Notification.js"
import { isAuthenticated } from "./auth.js"

const router = express.Router()

// Customer dashboard
router.get("/dashboard", isAuthenticated, async (req, res) => {
  try {
    const supportRequests = await SupportRequest.find({ customer: req.session.user }).sort({ createdAt: -1 })

    res.render("customer/dashboard", { supportRequests })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.status(500).render("error", { error: "Error loading dashboard" })
  }
})

// Customer profile page
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user)
    if (!user) {
      return res.redirect("/login")
    }
    res.render("customer/profile", { user })
  } catch (error) {
    console.error("Profile error:", error)
    res.status(500).render("error", { error: "Error loading profile" })
  }
})

// Update profile
router.post("/profile", isAuthenticated, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      businessName,
      street,
      city,
      state,
      zipCode,
      country,
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body

    const user = await User.findById(req.session.user)
    if (!user) {
      return res.redirect("/login")
    }

    // Update basic info
    user.firstName = firstName
    user.lastName = lastName
    user.phone = phone
    if (user.accountType === "business") {
      user.businessName = businessName
    }

    // Update address
    user.address = {
      street,
      city,
      state,
      zipCode,
      country,
    }

    // Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.render("customer/profile", {
          user,
          error: "Current password is required to change password",
        })
      }

      const isMatch = await user.comparePassword(currentPassword)
      if (!isMatch) {
        return res.render("customer/profile", {
          user,
          error: "Current password is incorrect",
        })
      }

      if (newPassword !== confirmPassword) {
        return res.render("customer/profile", {
          user,
          error: "New passwords do not match",
        })
      }

      user.password = newPassword // Will be hashed by pre-save hook
    }

    await user.save()

    res.render("customer/profile", {
      user,
      success: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Profile update error:", error)
    const user = await User.findById(req.session.user)
    res.render("customer/profile", {
      user,
      error: "Error updating profile",
    })
  }
})

// Support request form
router.get("/support/new", isAuthenticated, (req, res) => {
  res.render("customer/support-form")
})

// Submit support request
router.post("/support", isAuthenticated, async (req, res) => {
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

// View support request
router.get("/support/:id", isAuthenticated, async (req, res) => {
  try {
    const supportRequest = await SupportRequest.findOne({
      _id: req.params.id,
      customer: req.session.user,
    }).populate("customer", "firstName lastName email")

    if (!supportRequest) {
      return res.status(404).render("error", { error: "Support request not found" })
    }

    res.render("customer/support-detail", { supportRequest })
  } catch (error) {
    console.error("Support request detail error:", error)
    res.status(500).render("error", { error: "Error loading support request" })
  }
})

// Route to get all support requests for a customer
router.get("/support-requests", isAuthenticated, async (req, res) => {
  try {
    const supportRequests = await SupportRequest.find({ customer: req.session.user })
    res.status(200).json(supportRequests)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Failed to fetch support requests.", error: error.message })
  }
})

// Route to get a specific support request by ID for a customer
router.get("/support-requests/:id", isAuthenticated, async (req, res) => {
  try {
    const supportRequest = await SupportRequest.findOne({ _id: req.params.id, customer: req.session.user })

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
router.get("/notifications", isAuthenticated, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.session.user }).sort({ createdAt: -1 }).limit(20)

    res.render("customer/notifications", { notifications })
  } catch (error) {
    console.error("Notifications error:", error)
    res.status(500).render("error", { error: "Error loading notifications" })
  }
})

// Add route to mark notification as read
router.post("/notifications/:id/read", isAuthenticated, async (req, res) => {
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

export const customerRoutes = router
