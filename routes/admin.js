import express from "express"
import { isAuthenticated, isAdmin } from "./auth.js"
import User from "../models/User.js"
import SupportRequest from "../models/SupportRequest.js"
import SparePart from "../models/SparePart.js"

const router = express.Router()

// Apply authentication and admin middleware to all admin routes
router.use(isAuthenticated)
router.use(isAdmin)

// Admin dashboard
router.get("/dashboard", async (req, res) => {
  try {
    // Get counts
    const pendingRequestsCount = await SupportRequest.countDocuments({ status: "pending" })
    const inProgressRequestsCount = await SupportRequest.countDocuments({ status: "in-progress" })
    const resolvedRequestsCount = await SupportRequest.countDocuments({ status: "resolved" })
    const customersCount = await User.countDocuments({ isAdmin: false })

    // Get low stock parts
    const lowStockParts = await SparePart.find({
      stockQuantity: { $lte: 5 },
      isActive: true,
    }).limit(5)

    // Get today's appointments
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayAppointments = await SupportRequest.find({
      appointmentDate: { $gte: today, $lt: tomorrow },
    }).populate("customer", "firstName lastName email phone")

    // Get recent support requests
    const recentRequests = await SupportRequest.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customer", "firstName lastName email")
      .lean() // Use lean() for better performance

    // Filter out requests with missing customers
    const validRecentRequests = recentRequests.filter((request) => request.customer)

    res.render("admin/dashboard", {
      pendingRequestsCount,
      inProgressRequestsCount,
      resolvedRequestsCount,
      customersCount,
      lowStockParts,
      todayAppointments,
      recentRequests: validRecentRequests,
    })
  } catch (error) {
    console.error("Admin dashboard error:", error)
    res.status(500).render("error", { error: "Error loading admin dashboard" })
  }
})

// Customer management
router.get("/customers", async (req, res) => {
  try {
    const customers = await User.find({ isAdmin: false }).sort({ createdAt: -1 })

    res.render("admin/customers", { customers })
  } catch (error) {
    console.error("Customer management error:", error)
    res.status(500).render("error", { error: "Error loading customers" })
  }
})

// View customer
router.get("/customers/:id", async (req, res) => {
  try {
    const customer = await User.findById(req.params.id)

    if (!customer) {
      return res.status(404).render("error", { error: "Customer not found" })
    }

    // Get customer's support requests
    const supportRequests = await SupportRequest.find({ customer: customer._id }).sort({ createdAt: -1 })

    res.render("admin/customer-detail", { customer, supportRequests })
  } catch (error) {
    console.error("View customer error:", error)
    res.status(500).render("error", { error: "Error loading customer details" })
  }
})

// Edit customer form
router.get("/customers/:id/edit", async (req, res) => {
  try {
    const customer = await User.findById(req.params.id)

    if (!customer) {
      return res.status(404).render("error", { error: "Customer not found" })
    }

    res.render("admin/customer-edit", { customer })
  } catch (error) {
    console.error("Edit customer form error:", error)
    res.status(500).render("error", { error: "Error loading customer edit form" })
  }
})

// Update customer
router.post("/customers/:id", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, accountType, businessName, street, city, state, zipCode, country } =
      req.body

    // Validate input
    if (!firstName || !lastName || !email || !phone) {
      return res.render("admin/customer-edit", {
        error: "Required fields cannot be empty",
        customer: { ...req.body, _id: req.params.id },
      })
    }

    const customer = await User.findById(req.params.id)

    if (!customer) {
      return res.status(404).render("error", { error: "Customer not found" })
    }

    // Update customer
    customer.firstName = firstName
    customer.lastName = lastName
    customer.email = email
    customer.phone = phone
    customer.accountType = accountType

    if (accountType === "business") {
      customer.businessName = businessName
    }

    customer.address = {
      street,
      city,
      state,
      zipCode,
      country,
    }

    await customer.save()

    res.redirect(`/admin/customers/${customer._id}`)
  } catch (error) {
    console.error("Update customer error:", error)
    res.status(500).render("error", { error: "Error updating customer" })
  }
})

// Delete customer
router.delete("/customers/:id", async (req, res) => {
  try {
    const customer = await User.findById(req.params.id)

    if (!customer) {
      return res.status(404).render("error", { error: "Customer not found" })
    }

    // Delete customer's support requests
    await SupportRequest.deleteMany({ customer: customer._id })

    // Delete customer
    await User.findByIdAndDelete(req.params.id)

    res.redirect("/admin/customers")
  } catch (error) {
    console.error("Delete customer error:", error)
    res.status(500).render("error", { error: "Error deleting customer" })
  }
})

// Support request management
router.get("/support", async (req, res) => {
  try {
    const { status, urgency, deviceType } = req.query

    // Build filter
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

    const supportRequests = await SupportRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate("customer", "firstName lastName email")

    res.render("admin/support-list", {
      supportRequests,
      filters: { status, urgency, deviceType },
    })
  } catch (error) {
    console.error("Support management error:", error)
    res.status(500).render("error", { error: "Error loading support requests" })
  }
})

// View support request
router.get("/support/:id", async (req, res) => {
  try {
    const supportRequest = await SupportRequest.findById(req.params.id)
      .populate("customer", "firstName lastName email phone businessName accountType")
      .populate("assignedTo", "firstName lastName email")
      .populate("partsUsed.part")

    if (!supportRequest) {
      return res.status(404).render("error", { error: "Support request not found" })
    }

    // Get available parts
    const availableParts = await SparePart.find({
      stockQuantity: { $gt: 0 },
      isActive: true,
    })

    // Get available technicians
    const technicians = await User.find({
      isAdmin: true,
      _id: { $ne: req.session.user }, // Exclude current admin
    })

    res.render("admin/support-detail", {
      supportRequest,
      availableParts,
      technicians,
    })
  } catch (error) {
    console.error("View support request error:", error)
    res.status(500).render("error", { error: "Error loading support request details" })
  }
})

// Update support request
router.post("/support/:id", async (req, res) => {
  try {
    const { status, assignedTo, resolution, appointmentDate, appointmentTime, actualCost, partIds, partQuantities } =
      req.body

    const supportRequest = await SupportRequest.findById(req.params.id)

    if (!supportRequest) {
      return res.status(404).render("error", { error: "Support request not found" })
    }

    // Update support request
    if (status) {
      supportRequest.status = status
    }

    if (assignedTo) {
      supportRequest.assignedTo = assignedTo
    }

    if (resolution) {
      supportRequest.resolution = resolution
    }

    if (actualCost) {
      supportRequest.actualCost = actualCost
    }

    // Update appointment date if provided
    if (appointmentDate && appointmentTime) {
      const dateTime = new Date(`${appointmentDate}T${appointmentTime}`)
      supportRequest.appointmentDate = dateTime
    }

    // Update parts used
    if (partIds && partIds.length > 0) {
      // Clear existing parts
      supportRequest.partsUsed = []

      // Add new parts
      for (let i = 0; i < partIds.length; i++) {
        const partId = partIds[i]
        const quantity = Number.parseInt(partQuantities[i]) || 1

        if (partId && quantity > 0) {
          // Get part to check stock
          const part = await SparePart.findById(partId)

          if (part && part.stockQuantity >= quantity) {
            // Add to support request
            supportRequest.partsUsed.push({
              part: partId,
              quantity,
            })

            // Update stock
            part.stockQuantity -= quantity
            await part.save()
          }
        }
      }
    }

    await supportRequest.save()

    res.redirect(`/admin/support/${supportRequest._id}`)
  } catch (error) {
    console.error("Update support request error:", error)
    res.status(500).render("error", { error: "Error updating support request" })
  }
})

// Spare parts management
router.get("/parts", async (req, res) => {
  try {
    const { category, lowStock } = req.query

    // Build filter
    const filter = { isActive: true }

    if (category) {
      filter.category = category
    }

    if (lowStock === "true") {
      filter.stockQuantity = { $lte: 5 }
    }

    const spareParts = await SparePart.find(filter).sort({ name: 1 })

    res.render("admin/parts-list", {
      spareParts,
      filters: { category, lowStock },
    })
  } catch (error) {
    console.error("Parts management error:", error)
    res.status(500).render("error", { error: "Error loading spare parts" })
  }
})

// Add part form
router.get("/parts/new", (req, res) => {
  res.render("admin/part-form", { part: {} })
})

// Add part
router.post("/parts", async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      compatibleDevices,
      stockQuantity,
      price,
      supplierName,
      supplierContact,
      location,
      minimumStockLevel,
    } = req.body

    // Validate input
    if (!name || !description || !category || !stockQuantity || !price) {
      return res.render("admin/part-form", {
        error: "Required fields cannot be empty",
        part: req.body,
      })
    }

    // Create new part
    const sparePart = new SparePart({
      name,
      description,
      category,
      compatibleDevices: Array.isArray(compatibleDevices) ? compatibleDevices : [compatibleDevices],
      stockQuantity,
      price,
      supplier: {
        name: supplierName,
        contactInfo: supplierContact,
      },
      location,
      minimumStockLevel: minimumStockLevel || 5,
      isActive: true,
    })

    await sparePart.save()

    res.redirect("/admin/parts")
  } catch (error) {
    console.error("Add part error:", error)
    res.status(500).render("error", { error: "Error adding spare part" })
  }
})

// Edit part form
router.get("/parts/:id/edit", async (req, res) => {
  try {
    const part = await SparePart.findById(req.params.id)

    if (!part) {
      return res.status(404).render("error", { error: "Part not found" })
    }

    res.render("admin/part-form", { part })
  } catch (error) {
    console.error("Edit part form error:", error)
    res.status(500).render("error", { error: "Error loading part edit form" })
  }
})

// Update part
router.post("/parts/:id", async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      compatibleDevices,
      stockQuantity,
      price,
      supplierName,
      supplierContact,
      location,
      minimumStockLevel,
    } = req.body

    // Validate input
    if (!name || !description || !category || !stockQuantity || !price) {
      return res.render("admin/part-form", {
        error: "Required fields cannot be empty",
        part: { ...req.body, _id: req.params.id },
      })
    }

    const part = await SparePart.findById(req.params.id)

    if (!part) {
      return res.status(404).render("error", { error: "Part not found" })
    }

    // Update part
    part.name = name
    part.description = description
    part.category = category
    part.compatibleDevices = Array.isArray(compatibleDevices) ? compatibleDevices : [compatibleDevices]
    part.stockQuantity = stockQuantity
    part.price = price
    part.supplier = {
      name: supplierName,
      contactInfo: supplierContact,
    }
    part.location = location
    part.minimumStockLevel = minimumStockLevel || 5

    await part.save()

    res.redirect("/admin/parts")
  } catch (error) {
    console.error("Update part error:", error)
    res.status(500).render("error", { error: "Error updating spare part" })
  }
})

// Delete part
router.delete("/parts/:id", async (req, res) => {
  try {
    const part = await SparePart.findById(req.params.id)

    if (!part) {
      return res.status(404).render("error", { error: "Part not found" })
    }

    // Soft delete by marking as inactive
    part.isActive = false
    await part.save()

    res.redirect("/admin/parts")
  } catch (error) {
    console.error("Delete part error:", error)
    res.status(500).render("error", { error: "Error deleting spare part" })
  }
})

// Analytics
router.get("/analytics", async (req, res) => {
  try {
    // Get support request stats
    const totalRequests = await SupportRequest.countDocuments()

    // Get device type distribution
    const deviceTypes = await SupportRequest.aggregate([
      { $group: { _id: "$deviceType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    // Get urgency distribution
    const urgencyLevels = await SupportRequest.aggregate([
      { $group: { _id: "$urgency", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ])

    // Get average customer rating
    const ratingResult = await SupportRequest.aggregate([
      { $match: { customerRating: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgRating: { $avg: "$customerRating" } } },
    ])
    const avgRating = ratingResult.length > 0 ? ratingResult[0].avgRating : 0

    // Get monthly request counts
    const monthlyRequests = await SupportRequest.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ])

    // Get location distribution
    const locations = await SupportRequest.aggregate([
      { $match: { location: { $exists: true, $ne: null, $ne: "" } } },
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ])

    res.render("admin/analytics", {
      totalRequests,
      deviceTypes,
      urgencyLevels,
      avgRating,
      monthlyRequests,
      locations,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    res.status(500).render("error", { error: "Error loading analytics" })
  }
})

export const adminRoutes = router
