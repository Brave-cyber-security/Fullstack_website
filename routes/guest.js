import express from "express"
import SupportRequest from "../models/SupportRequest.js"

const router = express.Router()

// Guest support form
router.get("/guest-support", (req, res) => {
  res.render("guest-support")
})

// Submit guest support request
router.post("/guest-support", async (req, res) => {
  try {
    const { email, name, phone, title, description, deviceType, urgency } = req.body

    // Validate required fields
    if (!email || !title || !description || !deviceType || !urgency) {
      return res.render("guest-support", {
        error: "Please fill in all required fields",
        ...req.body,
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.render("guest-support", {
        error: "Please enter a valid email address",
        ...req.body,
      })
    }

    // Create guest support request
    const supportRequest = new SupportRequest({
      guestEmail: email,
      guestName: name || "Guest User",
      guestPhone: phone,
      title,
      description,
      deviceType,
      urgency,
      status: "pending",
      approvalStatus: "pending_approval",
      isGuestRequest: true,
    })

    // Calculate estimated cost
    const baseRates = {
      desktop: 75,
      laptop: 85,
      tablet: 65,
      smartphone: 60,
      printer: 70,
      server: 150,
      network: 100,
      other: 80,
    }

    const urgencyMultipliers = {
      low: 1,
      medium: 1.25,
      high: 1.5,
      critical: 2,
    }

    const baseRate = baseRates[deviceType] || 80
    const multiplier = urgencyMultipliers[urgency] || 1
    supportRequest.estimatedCost = baseRate * multiplier

    await supportRequest.save()

    res.render("guest-support", {
      success: `Your support request has been submitted successfully! We'll contact you at ${email} within 15 minutes. Reference ID: ${supportRequest._id.toString().slice(-6).toUpperCase()}`,
    })
  } catch (error) {
    console.error("Guest support request error:", error)
    res.render("guest-support", {
      error: "An error occurred while submitting your request. Please try again.",
      ...req.body,
    })
  }
})

export { router as guestRoutes }
