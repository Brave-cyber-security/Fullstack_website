import express from "express"
import { isAuthenticated, isMaster } from "./auth.js"
import User from "../models/User.js"
import SupportRequest from "../models/SupportRequest.js"
import SparePart from "../models/SparePart.js"
import KnowledgeBase from "../models/KnowledgeBase.js"
import { sendGuestApprovalNotification, sendGuestRejectionNotification } from '../utils/emailservice.js'


const router = express.Router()

// Apply authentication and master middleware to all master routes
router.use(isAuthenticated)
router.use(isMaster)

// Master dashboard with comprehensive data access
router.get("/dashboard", async (req, res) => {
  try {
    // Get comprehensive counts (master should see everything)
    const totalUsers = await User.countDocuments()
    const totalCustomers = await User.countDocuments({ isAdmin: false, isMaster: false })
    const totalAdmins = await User.countDocuments({ isAdmin: true })
    const totalMasters = await User.countDocuments({ isMaster: true })

    // Get all support request counts
    const totalRequests = await SupportRequest.countDocuments()
    const pendingRequestsCount = await SupportRequest.countDocuments({ status: "pending" })
    const pendingApprovalCount = await SupportRequest.countDocuments({ approvalStatus: "pending_approval" })
    const inProgressRequestsCount = await SupportRequest.countDocuments({ status: "in-progress" })
    const resolvedRequestsCount = await SupportRequest.countDocuments({ status: "resolved" })

    // Get all support requests (master should see everything)
    const allSupportRequests = await SupportRequest.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("customer", "firstName lastName email phone businessName accountType")
      .populate("assignedTo", "firstName lastName email")
      .populate("masterApprovedBy", "firstName lastName email")
      .lean()

    // Filter out requests with missing customers but keep the data
    const validSupportRequests = allSupportRequests.map((request) => ({
      ...request,
      customer: request.customer || { firstName: "Deleted", lastName: "Customer", email: "N/A" },
    }))

    // Get requests pending master approval
    const pendingApprovalRequests = await SupportRequest.find({
      approvalStatus: "pending_approval",
    })
      .sort({ createdAt: -1 })
      .populate("customer", "firstName lastName email phone businessName accountType")
      .lean()

    // Get today's appointments
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayAppointments = await SupportRequest.find({
      appointmentDate: { $gte: today, $lt: tomorrow },
    }).populate("customer", "firstName lastName email phone")

    // Get low stock parts
    const lowStockParts = await SparePart.find({
      stockQuantity: { $lte: 5 },
      isActive: true,
    }).limit(5)

    // Get system statistics
    const totalKnowledgeArticles = await KnowledgeBase.countDocuments({ isPublished: true })

    res.render("master/dashboard", {
      title: "Master Dashboard",
      // User statistics
      totalUsers: totalUsers || 0,
      totalCustomers: totalCustomers || 0,
      totalAdmins: totalAdmins || 0,
      totalMasters: totalMasters || 0,
      // Support request statistics
      totalRequests: totalRequests || 0,
      pendingRequestsCount: pendingRequestsCount || 0,
      pendingApprovalCount: pendingApprovalCount || 0,
      inProgressRequestsCount: inProgressRequestsCount || 0,
      resolvedRequestsCount: resolvedRequestsCount || 0,
      // Data arrays
      allSupportRequests: validSupportRequests || [],
      pendingApprovalRequests: pendingApprovalRequests || [],
      todayAppointments: todayAppointments || [],
      lowStockParts: lowStockParts || [],
      // System statistics
      totalKnowledgeArticles: totalKnowledgeArticles || 0,
    })
  } catch (error) {
    console.error("Master dashboard error:", error)
    res.status(500).render("error", { error: "Error loading master dashboard" })
  }
})

// Master support request management (view all requests)
router.get("/support", async (req, res) => {
  try {
    const { status, urgency, deviceType, approvalStatus } = req.query

    // Build filter (master can see all requests regardless of approval status)
    const filter = {}

    if (status) {
      filter.status = status
    }

    if (urgency) {
      filter.urgency = urgency
    }

    if (deviceType) {
      filter.deviceType = deviceType
    }

    if (approvalStatus) {
      filter.approvalStatus = approvalStatus
    }

    const supportRequests = await SupportRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("customer", "firstName lastName email phone businessName accountType")
      .populate("assignedTo", "firstName lastName email")
      .populate("masterApprovedBy", "firstName lastName email")

    res.render("master/support-list", {
      title: "All Support Requests",
      supportRequests,
      filters: { status, urgency, deviceType, approvalStatus },
    })
  } catch (error) {
    console.error("Master support management error:", error)
    res.status(500).render("error", { error: "Error loading support requests" })
  }
})

// Master support request detail view
router.get("/support/:id", async (req, res) => {
  try {
    const supportRequest = await SupportRequest.findById(req.params.id)
      .populate("customer", "firstName lastName email phone businessName accountType address")
      .populate("assignedTo", "firstName lastName email")
      .populate("masterApprovedBy", "firstName lastName email")
      .populate("partsUsed.part")

    if (!supportRequest) {
      return res.status(404).render("error", { error: "Support request not found" })
    }

    // Get available parts for master to manage
    const availableParts = await SparePart.find({
      stockQuantity: { $gt: 0 },
      isActive: true,
    })

    // Get all technicians (admins) for assignment
    const technicians = await User.find({
      isAdmin: true,
    })

    res.render("master/support-detail", {
      title: "Support Request Details",
      supportRequest,
      availableParts,
      technicians,
    })
  } catch (error) {
    console.error("Master support detail error:", error)
    res.status(500).render("error", { error: "Error loading support request details" })
  }
})

// Master approval/rejection of support requests with email notifications
router.post("/support/:id/approve", async (req, res) => {
  try {
    const { action, masterSetPrice, masterComments, rejectionReason } = req.body

    const supportRequest = await SupportRequest.findById(req.params.id)

    if (!supportRequest) {
      return res.status(404).render("error", { error: "Support request not found" })
    }

    if (action === "approve") {
      supportRequest.approvalStatus = "approved"
      supportRequest.masterApprovedBy = req.session.user
      supportRequest.masterApprovedAt = new Date()
      supportRequest.masterSetPrice = masterSetPrice ? Number.parseFloat(masterSetPrice) : null
      supportRequest.masterComments = masterComments
      supportRequest.status = "pending" // Move to pending for admin assignment

      await supportRequest.save()

      // Send email notification for guest requests
      if (supportRequest.isGuestRequest) {
        try {
          const emailResult = await sendGuestApprovalNotification(supportRequest)
          if (emailResult.success) {
            console.log(`✅ Approval email sent to guest: ${supportRequest.guestEmail}`)
          } else {
            console.error(`❌ Failed to send approval email: ${emailResult.error}`)
          }
        } catch (emailError) {
          console.error("Email notification error:", emailError)
          // Don't fail the approval process if email fails
        }
      }
    } else if (action === "reject") {
      supportRequest.approvalStatus = "rejected"
      supportRequest.rejectionReason = rejectionReason
      supportRequest.masterComments = masterComments
      supportRequest.status = "closed"

      await supportRequest.save()

      // Send email notification for guest requests
      if (supportRequest.isGuestRequest) {
        try {
          const emailResult = await sendGuestRejectionNotification(supportRequest)
          if (emailResult.success) {
            console.log(`✅ Rejection email sent to guest: ${supportRequest.guestEmail}`)
          } else {
            console.error(`❌ Failed to send rejection email: ${emailResult.error}`)
          }
        } catch (emailError) {
          console.error("Email notification error:", emailError)
          // Don't fail the rejection process if email fails
        }
      }
    }

    res.redirect(`/master/support/${supportRequest._id}`)
  } catch (error) {
    console.error("Master approval error:", error)
    res.status(500).render("error", { error: "Error processing approval" })
  }
})

// User management (master can manage all users)
router.get("/users", async (req, res) => {
  try {
    const { role, accountType } = req.query

    // Build filter
    const filter = {}

    if (role === "customer") {
      filter.isAdmin = false
      filter.isMaster = false
    } else if (role === "admin") {
      filter.isAdmin = true
      filter.isMaster = false
    } else if (role === "master") {
      filter.isMaster = true
    }

    if (accountType) {
      filter.accountType = accountType
    }

    const users = await User.find(filter).sort({ createdAt: -1 }).select("-password") // Exclude password field

    res.render("master/users", {
      title: "User Management",
      users,
      filters: { role, accountType },
    })
  } catch (error) {
    console.error("Master user management error:", error)
    res.status(500).render("error", { error: "Error loading users" })
  }
})

// User detail view
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password")

    if (!user) {
      return res.status(404).render("error", { error: "User not found" })
    }

    // Get user's support requests
    const userSupportRequests = await SupportRequest.find({ customer: user._id })
      .sort({ createdAt: -1 })
      .populate("assignedTo", "firstName lastName email")
      .populate("masterApprovedBy", "firstName lastName email")

    res.render("master/user-detail", {
      title: "User Details",
      user,
      userSupportRequests,
    })
  } catch (error) {
    console.error("Master user detail error:", error)
    res.status(500).render("error", { error: "Error loading user details" })
  }
})

// System settings
router.get("/settings", async (req, res) => {
  try {
    // Get system statistics for settings page
    const systemStats = {
      totalUsers: await User.countDocuments(),
      totalRequests: await SupportRequest.countDocuments(),
      totalParts: await SparePart.countDocuments({ isActive: true }),
      totalArticles: await KnowledgeBase.countDocuments({ isPublished: true }),
    }

    res.render("master/settings", {
      title: "System Settings",
      systemStats,
    })
  } catch (error) {
    console.error("Master settings error:", error)
    res.status(500).render("error", { error: "Error loading settings" })
  }
})

// System logs (placeholder for future implementation)
router.get("/logs", async (req, res) => {
  try {
    // This would typically fetch from a logging system
    const logs = [
      {
        timestamp: new Date(),
        level: "INFO",
        message: "System started successfully",
        user: "System",
      },
    ]

    res.render("master/logs", {
      title: "System Logs",
      logs,
    })
  } catch (error) {
    console.error("Master logs error:", error)
    res.status(500).render("error", { error: "Error loading logs" })
  }
})

export { router as masterRoutes }
