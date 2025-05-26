import dotenv from "dotenv"
import { runEmailDiagnostics, testEmailWorkflow } from "./utils/emailDiagnostics.js"

// Load environment variables
dotenv.config()

async function verifyEmailSetup() {
  console.log("🚀 Starting Email Setup Verification...\n")

  // Run diagnostics
  await runEmailDiagnostics()

  // Ask for test email
  const testEmail = process.argv[2]

  if (testEmail) {
    await testEmailWorkflow(testEmail)
  } else {
    console.log("💡 To test email sending, run: node verify-email-setup.js your-email@example.com")
  }
}

verifyEmailSetup().catch(console.error)
