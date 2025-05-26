import express from "express"
import cors from "cors"
import morgan from "morgan"
import { notFound } from "./middleware/notFound.js"
import { errorHandler } from "./middleware/errorHandler.js"
import authRoutes from "./routes/authRoutes.js"
import userRoutes from "./routes/userRoutes.js"
import productRoutes from "./routes/productRoutes.js"
import orderRoutes from "./routes/orderRoutes.js"
import paymentRoutes from "./routes/paymentRoutes.js"
import reviewRoutes from "./routes/reviewRoutes.js"
import categoryRoutes from "./routes/categoryRoutes.js"
import uploadRoutes from "./routes/uploadRoutes.js"
import couponRoutes from "./routes/couponRoutes.js"
import newsletterRoutes from "./routes/newsletterRoutes.js"
import { connectDB } from "./config/db.js"
import { seedAdminUser } from "./seeder.js"
import path from "path"

const app = express()

// Connect DB
connectDB()

// Seed Admin User
seedAdminUser()

// Middlewares
app.use(cors())
app.use(express.json())
app.use(morgan("dev"))

// Routes
app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/users", userRoutes)
app.use("/api/v1/products", productRoutes)
app.use("/api/v1/orders", orderRoutes)
app.use("/api/v1/payments", paymentRoutes)
app.use("/api/v1/reviews", reviewRoutes)
app.use("/api/v1/categories", categoryRoutes)
app.use("/api/v1/uploads", uploadRoutes)
app.use("/api/v1/coupons", couponRoutes)
app.use("/api/v1/newsletter", newsletterRoutes)

// Email testing routes (for development only)
import { sendTestEmail, testEmailConnection } from "./utils/emailService.js"

app.get("/test-email-connection", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      error: "Email testing not allowed in production",
    })
  }

  try {
    console.log("🧪 Testing email connection...")
    console.log("🧪 Environment check:")
    console.log("  - SMTP_USER:", process.env.SMTP_USER || "NOT SET")
    console.log("  - SMTP_PASS:", process.env.SMTP_PASS ? "SET" : "NOT SET")
    console.log("  - NODE_ENV:", process.env.NODE_ENV || "development")

    const result = await testEmailConnection()

    console.log("🧪 Connection test result:", result)

    res.json({
      success: result.success,
      message: result.message || result.error,
      environment: {
        smtpUser: process.env.SMTP_USER || "NOT SET",
        smtpPassSet: !!process.env.SMTP_PASS,
        nodeEnv: process.env.NODE_ENV || "development",
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("🧪 Connection test error:", error)
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    })
  }
})

app.get("/test-email/:email", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({
      success: false,
      error: "Email testing not allowed in production",
    })
  }

  try {
    const testEmail = req.params.email
    console.log("🧪 Sending test email to:", testEmail)

    if (!testEmail || !testEmail.includes("@")) {
      return res.status(400).json({
        success: false,
        error: "Invalid email address provided",
      })
    }

    const result = await sendTestEmail(testEmail)

    console.log("🧪 Test email result:", result)

    res.json({
      success: result.success,
      message: result.success ? "Test email sent successfully" : result.error,
      messageId: result.messageId,
      details: result.details,
      timestamp: new Date().toISOString(),
      recipient: testEmail,
    })
  } catch (error) {
    console.error("🧪 Test email error:", error)
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    })
  }
})

// Email diagnostic routes (development only)
app.get("/email-diagnostics", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Diagnostics not allowed in production" })
  }

  try {
    const { runEmailDiagnostics } = await import("./utils/emailDiagnostics.js")
    const results = await runEmailDiagnostics()
    res.json(results)
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack })
  }
})

app.get("/test-email-workflow/:email", async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Testing not allowed in production" })
  }

  try {
    const { testEmailWorkflow } = await import("./utils/emailDiagnostics.js")
    const results = await testEmailWorkflow(req.params.email)
    res.json(results)
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack })
  }
})

// Serve static assets if in production
const __dirname = path.resolve()
app.use("/uploads", express.static(path.join(__dirname, "/uploads")))

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/client/build")))

  app.get("*", (req, res) => res.sendFile(path.resolve(__dirname, "client", "build", "index.html")))
} else {
  app.get("/", (req, res) => {
    res.send("API is running....")
  })
}

// Error middlewares
app.use(notFound)
app.use(errorHandler)

export default app
