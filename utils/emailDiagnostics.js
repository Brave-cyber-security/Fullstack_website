import { testEmailConnection, sendTestEmail } from "./emailService.js"

export const runEmailDiagnostics = async () => {
  console.log("\n🔍 ===== EMAIL DIAGNOSTICS STARTING =====\n")

  const results = {
    timestamp: new Date().toISOString(),
    environment: {},
    connectionTest: {},
    recommendations: [],
  }

  // 1. Environment Check
  console.log("1️⃣ Checking Environment Variables...")
  results.environment = {
    SMTP_USER: process.env.SMTP_USER || "NOT SET",
    SMTP_PASS: process.env.SMTP_PASS ? "SET" : "NOT SET",
    SMTP_HOST: process.env.SMTP_HOST || "NOT SET (using Gmail service)",
    SMTP_PORT: process.env.SMTP_PORT || "NOT SET (using Gmail service)",
    FRONTEND_URL: process.env.FRONTEND_URL || "NOT SET",
    NODE_ENV: process.env.NODE_ENV || "development",
  }

  console.log("📊 Environment Status:")
  Object.entries(results.environment).forEach(([key, value]) => {
    const status = value.includes("NOT SET") ? "❌" : "✅"
    console.log(`   ${status} ${key}: ${value}`)
  })

  // 2. Required Variables Check
  console.log("\n2️⃣ Checking Required Variables...")
  const requiredVars = ["SMTP_USER", "SMTP_PASS"]
  const missingVars = requiredVars.filter((varName) => !process.env[varName])

  if (missingVars.length > 0) {
    console.log("❌ Missing required variables:", missingVars)
    results.recommendations.push(`Set missing environment variables: ${missingVars.join(", ")}`)
  } else {
    console.log("✅ All required variables are set")
  }

  // 3. Gmail Configuration Check
  console.log("\n3️⃣ Checking Gmail Configuration...")
  if (process.env.SMTP_USER) {
    const isGmail = process.env.SMTP_USER.includes("@gmail.com")
    console.log(`📧 Email provider: ${isGmail ? "Gmail ✅" : "Other provider ⚠️"}`)

    if (isGmail) {
      console.log("📋 Gmail Setup Checklist:")
      console.log("   ✓ Use App Password (not regular password)")
      console.log("   ✓ Enable 2-Factor Authentication")
      console.log("   ✓ Generate App Password in Google Account settings")
      console.log("   ✓ Use the 16-character app password in SMTP_PASS")
    }
  }

  // 4. Connection Test
  console.log("\n4️⃣ Testing SMTP Connection...")
  try {
    results.connectionTest = await testEmailConnection()
    if (results.connectionTest.success) {
      console.log("✅ SMTP connection successful")
    } else {
      console.log("❌ SMTP connection failed:", results.connectionTest.error)
      results.recommendations.push("Check SMTP credentials and network connectivity")
    }
  } catch (error) {
    console.log("❌ Connection test error:", error.message)
    results.connectionTest = { success: false, error: error.message }
  }

  // 5. Recommendations
  console.log("\n5️⃣ Recommendations:")
  if (results.recommendations.length === 0) {
    console.log("✅ No issues found - email system should be working")
  } else {
    results.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`)
    })
  }

  console.log("\n🔍 ===== EMAIL DIAGNOSTICS COMPLETE =====\n")
  return results
}

export const testEmailWorkflow = async (testEmail) => {
  console.log("\n🧪 ===== EMAIL WORKFLOW TEST =====\n")

  if (!testEmail || !testEmail.includes("@")) {
    console.log("❌ Invalid test email provided")
    return { success: false, error: "Invalid email address" }
  }

  console.log(`📧 Testing email workflow with: ${testEmail}`)

  try {
    // Test 1: Basic email sending
    console.log("\n1️⃣ Testing basic email sending...")
    const testResult = await sendTestEmail(testEmail)

    if (testResult.success) {
      console.log("✅ Test email sent successfully")
      console.log(`📨 Message ID: ${testResult.messageId}`)
    } else {
      console.log("❌ Test email failed:", testResult.error)
      return testResult
    }

    // Test 2: Template rendering
    console.log("\n2️⃣ Testing email templates...")
    const { sendEmail } = await import("./emailService.js")

    const mockSupportRequest = {
      _id: { toString: () => "507f1f77bcf86cd799439011" },
      title: "Test Support Request",
      deviceType: "Laptop",
      urgency: "medium",
      masterSetPrice: 150,
      masterComments: "Test approval",
    }

    const mockAccountInfo = {
      email: testEmail,
      username: "testuser123",
      password: "TestPass123!",
    }

    const approvalResult = await sendEmail(testEmail, "requestApproved", mockSupportRequest, mockAccountInfo)

    if (approvalResult.success) {
      console.log("✅ Approval email template test successful")
    } else {
      console.log("❌ Approval email template test failed:", approvalResult.error)
    }

    console.log("\n🧪 ===== EMAIL WORKFLOW TEST COMPLETE =====\n")
    return { success: true, message: "Email workflow test completed" }
  } catch (error) {
    console.log("❌ Workflow test error:", error.message)
    return { success: false, error: error.message }
  }
}
