import express from "express"

const router = express.Router()

// Middleware to check if user is master admin
const requireMaster = (req, res, next) => {
  if (!req.session.user || !req.session.isMaster) {
    return res.status(403).render("error", {
      error: "Access denied. Master admin privileges required.",
    })
  }
  next()
}

// Master dashboard
router.get("/dashboard", requireMaster, (req, res) => {
  res.render("master/dashboard", {
    title: "Master Dashboard",
  })
})

// System settings
router.get("/settings", requireMaster, (req, res) => {
  res.render("master/settings", {
    title: "System Settings",
  })
})

// User management
router.get("/users", requireMaster, (req, res) => {
  res.render("master/users", {
    title: "User Management",
  })
})

// System logs
router.get("/logs", requireMaster, (req, res) => {
  res.render("master/logs", {
    title: "System Logs",
  })
})

export { router as masterRoutes }
