import { execSync } from "child_process"
import fs from "fs"
import path from "path"

console.log("🚀 Installing Dern-Support dependencies...\n")

try {
  // Install npm dependencies
  console.log("📦 Installing npm packages...")
  execSync("npm install", { stdio: "inherit" })

  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads")
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
    console.log("📁 Created uploads directory")
  }

  // Create logs directory if it doesn't exist
  const logsDir = path.join(process.cwd(), "logs")
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
    console.log("📁 Created logs directory")
  }

  console.log("\n✅ Installation completed successfully!")
  console.log("\n🔧 Next steps:")
  console.log("1. Make sure MongoDB is running")
  console.log("2. Update the .env file with your configuration")
  console.log('3. Run "npm run seed" to populate the database')
  console.log('4. Run "npm start" to start the server')
} catch (error) {
  console.error("❌ Installation failed:", error.message)
  process.exit(1)
}
