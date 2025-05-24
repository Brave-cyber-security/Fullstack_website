import express from "express"
import User from "../models/User.js"

const router = express.Router()

// Middleware to check if user is authenticated
export const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next()
  }
  res.redirect("/login")
}

// Middleware to check if user is admin
export const isAdmin = async (req, res, next) => {
  try {
    if (req.session.user) {
      const user = await User.findById(req.session.user)
      if (user && user.isAdmin) {
        return next()
      }
    }
    res.status(403).render("error", { error: "Access denied. Admin privileges required." })
  } catch (error) {
    console.error("Admin middleware error:", error)
    res.status(500).render("error", { error: "Error checking admin privileges" })
  }
}

// Middleware to check if user is master
export const isMaster = async (req, res, next) => {
  try {
    if (req.session.user && req.session.isMaster) {
      const user = await User.findById(req.session.user)
      if (user && user.isMaster) {
        return next()
      }
    }
    res.status(403).render("error", { error: "Access denied. Master privileges required." })
  } catch (error) {
    console.error("Master middleware error:", error)
    res.status(500).render("error", { error: "Error checking master privileges" })
  }
}

// Register route
router.post("/register", async (req, res) => {
  try {
    const {
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      phone,
      accountType,
      businessName,
      street,
      city,
      state,
      zipCode,
      country,
    } = req.body

    // Validate input
    if (!email || !password || !firstName || !lastName || !phone) {
      return res.render("auth/signup", {
        error: "All required fields must be filled",
        ...req.body,
      })
    }

    if (password !== confirmPassword) {
      return res.render("auth/signup", {
        error: "Passwords do not match",
        ...req.body,
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.render("auth/signup", {
        error: "Email already registered",
        ...req.body,
      })
    }

    // Create new user
    const newUser = new User({
      email,
      password, // Will be hashed by the pre-save hook
      firstName,
      lastName,
      phone,
      accountType,
      businessName: accountType === "business" ? businessName : undefined,
      address: {
        street,
        city,
        state,
        zipCode,
        country,
      },
    })

    await newUser.save()

    // Set session
    req.session.user = newUser._id
    req.session.isAdmin = newUser.isAdmin
    req.session.isMaster = newUser.isMaster

    res.redirect("/customer/dashboard")
  } catch (error) {
    console.error("Registration error:", error)
    res.render("auth/signup", {
      error: "Registration failed. Please try again.",
      ...req.body,
    })
  }
})

// Login route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body

    // Validate input
    if (!email || !password) {
      return res.render("auth/login", {
        error: "Email and password are required",
        email,
      })
    }

    // Find user
    const user = await User.findOne({ email })
    if (!user) {
      return res.render("auth/login", {
        error: "Invalid email or password",
        email,
      })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.render("auth/login", {
        error: "Invalid email or password",
        email,
      })
    }

    // Set session
    req.session.user = user._id
    req.session.isAdmin = user.isAdmin
    req.session.isMaster = user.isMaster

    // Redirect based on role
    let returnTo = req.session.returnTo
    delete req.session.returnTo

    if (!returnTo) {
      if (user.isMaster) {
        returnTo = "/master/dashboard"
      } else if (user.isAdmin) {
        returnTo = "/admin/dashboard"
      } else {
        returnTo = "/customer/dashboard"
      }
    }

    res.redirect(returnTo)
  } catch (error) {
    console.error("Login error:", error)
    res.render("auth/login", {
      error: "An error occurred during login",
      email: req.body.email,
    })
  }
})

// Logout route
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err)
      return res.status(500).render("error", { error: "Logout failed" })
    }
    res.redirect("/")
  })
})

export const authRoutes = router
