import nodemailer from "nodemailer"
import crypto from "crypto"

// Create Gmail transporter (more reliable than manual SMTP)
const createTransporter = () => {
  console.log("📧 Creating Gmail transporter...")
  console.log("SMTP_USER:", process.env.SMTP_USER)
  console.log("SMTP_PASS:", process.env.SMTP_PASS ? "***configured***" : "NOT SET")

  return nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: 'begzad10.09@gmail.com',
      pass: 'gaim idvq itpv qnia', // Gmail App Password
    },
    debug: process.env.NODE_ENV === "development",
    logger: process.env.NODE_ENV === "development",
  })
}

// Secure password generation
const generateSecurePassword = (length = 12) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  let password = ""

  // Ensure at least one character from each category
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  const symbols = "!@#$%^&*"

  password += lowercase[crypto.randomInt(0, lowercase.length)]
  password += uppercase[crypto.randomInt(0, uppercase.length)]
  password += numbers[crypto.randomInt(0, numbers.length)]
  password += symbols[crypto.randomInt(0, symbols.length)]

  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[crypto.randomInt(0, charset.length)]
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => crypto.randomInt(-1, 2))
    .join("")
}

// Generate unique username from email
const generateUsername = (email, firstName = "", lastName = "") => {
  const emailPrefix = email.split("@")[0]
  const cleanFirstName = firstName.toLowerCase().replace(/[^a-z0-9]/g, "")
  const cleanLastName = lastName.toLowerCase().replace(/[^a-z0-9]/g, "")

  // Try different combinations
  const options = [
    `${cleanFirstName}${cleanLastName}`,
    `${cleanFirstName}.${cleanLastName}`,
    `${emailPrefix}`,
    `${cleanFirstName}${crypto.randomInt(100, 999)}`,
    `user${crypto.randomInt(1000, 9999)}`,
  ]

  return options.find((option) => option.length >= 3) || `user${crypto.randomInt(1000, 9999)}`
}

// Email templates
const emailTemplates = {
  accountCreated: (accountInfo, supportRequest) => ({
    subject: `🎉 Welcome to Dern Support - Your Account Has Been Created`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">🎉 Welcome to Dern Support!</h1>
          <p style="margin: 15px 0 0 0; font-size: 16px; opacity: 0.9;">Your account has been successfully created</p>
        </div>
        
        <!-- Main Content -->
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Account Information -->
          <div style="background: #e8f5e8; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 5px solid #28a745;">
            <h2 style="color: #155724; margin-top: 0; font-size: 20px;">🔐 Your Account Details</h2>
            <div style="background: white; padding: 20px; border-radius: 6px; margin: 15px 0; font-family: 'Courier New', monospace; border: 1px solid #c3e6cb;">
              <p style="margin: 8px 0; font-size: 14px;"><strong>Email:</strong> <span style="color: #007bff;">${accountInfo.email}</span></p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Username:</strong> <span style="color: #007bff;">${accountInfo.username}</span></p>
              <p style="margin: 8px 0; font-size: 14px;"><strong>Password:</strong> <span style="color: #dc3545; font-weight: bold;">${accountInfo.password}</span></p>
            </div>
            <div style="background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107;">
              <p style="margin: 0; color: #856404; font-size: 13px;">
                <strong>🔒 Security Notice:</strong> Please change your password after your first login for enhanced security.
              </p>
            </div>
          </div>

          <!-- Support Request Information -->
          ${
            supportRequest
              ? `
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 5px solid #6c757d;">
            <h3 style="color: #495057; margin-top: 0;">📋 Your Support Request</h3>
            <p style="margin: 5px 0;"><strong>Request ID:</strong> #${supportRequest._id.toString().slice(-8)}</p>
            <p style="margin: 5px 0;"><strong>Title:</strong> ${supportRequest.title}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Approved & Processing</span></p>
            ${supportRequest.masterSetPrice ? `<p style="margin: 5px 0;"><strong>Approved Price:</strong> $${supportRequest.masterSetPrice}</p>` : ""}
          </div>
          `
              : ""
          }

          <!-- Next Steps -->
          <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 5px solid #17a2b8;">
            <h3 style="color: #0c5460; margin-top: 0;">🚀 What's Next?</h3>
            <ul style="color: #0c5460; margin: 0; padding-left: 20px; line-height: 1.6;">
              <li>Login to your account using the credentials above</li>
              <li>Complete your profile information</li>
              <li>Track your support request progress</li>
              <li>Submit future requests easily</li>
              <li>Access our knowledge base and resources</li>
            </ul>
          </div>

          <!-- Action Buttons -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" 
               style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; margin-right: 15px; box-shadow: 0 2px 4px rgba(0,123,255,0.3);">
              🔑 Login to Your Account
            </a>
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/customer/dashboard" 
               style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; box-shadow: 0 2px 4px rgba(40,167,69,0.3);">
              📊 View Dashboard
            </a>
          </div>

          <!-- Support Information -->
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; border-top: 3px solid #007bff;">
            <h4 style="color: #495057; margin-top: 0;">Need Help?</h4>
            <p style="color: #6c757d; margin: 10px 0;">Our support team is here to assist you</p>
            <p style="margin: 5px 0;">
              📧 Email: <a href="mailto:support@dern-support.com" style="color: #007bff; text-decoration: none;">support@dern-support.com</a>
            </p>
            <p style="margin: 5px 0;">
              📞 Phone: <a href="tel:+1234567890" style="color: #007bff; text-decoration: none;">+1 (234) 567-8900</a>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 20px; color: #6c757d; font-size: 12px;">
          <p>© 2024 Dern Support. All rights reserved.</p>
          <p>This email was sent to ${accountInfo.email}</p>
        </div>
      </div>
    `,
    text: `
Welcome to Dern Support!

Your account has been successfully created. Here are your login details:

Account Details:
- Email: ${accountInfo.email}
- Username: ${accountInfo.username}
- Password: ${accountInfo.password}

SECURITY NOTICE: Please change your password after your first login.

${
  supportRequest
    ? `
Your Support Request:
- Request ID: #${supportRequest._id.toString().slice(-8)}
- Title: ${supportRequest.title}
- Status: Approved & Processing
${supportRequest.masterSetPrice ? `- Approved Price: $${supportRequest.masterSetPrice}` : ""}
`
    : ""
}

What's Next?
1. Login to your account: ${process.env.FRONTEND_URL || "http://localhost:3000"}/login
2. Complete your profile information
3. Track your support request progress
4. Submit future requests easily

Need help? Contact us:
Email: support@dern-support.com
Phone: +1 (234) 567-8900

© 2024 Dern Support. All rights reserved.
    `,
  }),

  requestApproved: (supportRequest, accountInfo = null) => ({
    subject: `✅ Support Request #${supportRequest._id.toString().slice(-8)} Approved`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">✅ Request Approved!</h1>
          <p style="margin: 15px 0 0 0; font-size: 16px; opacity: 0.9;">Your support request has been approved and is being processed</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          ${
            accountInfo
              ? `
          <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin-top: 0;">🎉 Account Created!</h3>
            <p style="color: #155724;">We've created a personal account for you:</p>
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 10px 0; font-family: monospace;">
              <p style="margin: 5px 0;"><strong>Email:</strong> ${accountInfo.email}</p>
              <p style="margin: 5px 0;"><strong>Username:</strong> ${accountInfo.username}</p>
              <p style="margin: 5px 0;"><strong>Password:</strong> ${accountInfo.password}</p>
            </div>
          </div>
          `
              : ""
          }
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Request Details</h2>
            <p><strong>Request ID:</strong> #${supportRequest._id.toString().slice(-8)}</p>
            <p><strong>Title:</strong> ${supportRequest.title}</p>
            <p><strong>Device Type:</strong> ${supportRequest.deviceType}</p>
            <p><strong>Urgency:</strong> ${supportRequest.urgency}</p>
            ${supportRequest.masterSetPrice ? `<p><strong>Approved Price:</strong> $${supportRequest.masterSetPrice}</p>` : ""}
            ${supportRequest.masterComments ? `<p><strong>Comments:</strong> ${supportRequest.masterComments}</p>` : ""}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            ${
              accountInfo
                ? `
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
              Login to Account
            </a>
            `
                : ""
            }
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/customer/dashboard" 
               style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Dashboard
            </a>
          </div>
        </div>
      </div>
    `,
    text: `
Support Request #${supportRequest._id.toString().slice(-8)} Approved!

${
  accountInfo
    ? `
Account Created:
- Email: ${accountInfo.email}
- Username: ${accountInfo.username}
- Password: ${accountInfo.password}
`
    : ""
}

Request Details:
- Title: ${supportRequest.title}
- Device Type: ${supportRequest.deviceType}
- Urgency: ${supportRequest.urgency}
${supportRequest.masterSetPrice ? `- Approved Price: $${supportRequest.masterSetPrice}` : ""}

Login: ${process.env.FRONTEND_URL || "http://localhost:3000"}/login
    `,
  }),

  testEmail: () => ({
    subject: "🧪 Dern Support - Email Test",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #007bff; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <h1>✅ Email Test Successful!</h1>
          <p>Your email configuration is working correctly.</p>
          <p>Timestamp: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    `,
    text: `Email Test Successful! Configuration working. Time: ${new Date().toLocaleString()}`,
  }),
}

// Main email sending function
export const sendEmail = async (to, template, data, accountInfo = null) => {
  try {
    console.log(`📧 Sending email to: ${to}`)
    console.log(`📧 Template: ${template}`)

    const transporter = createTransporter()
    const emailContent = emailTemplates[template](data, accountInfo)

    const mailOptions = {
      from: `"Dern Support" <${process.env.SMTP_USER}>`,
      to: 'nadirovabdulhaq1@gmail.com',
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("✅ Email sent successfully:", result.messageId)
    return { success: true, messageId: result.messageId, response: result.response }
  } catch (error) {
    console.error("❌ Email sending failed:", error)
    return { success: false, error: error.message, details: error }
  }
}

// Test email connection
export const testEmailConnection = async () => {
  try {
    const transporter = createTransporter()
    console.log("🔍 Testing email connection...")

    const result = await transporter.verify()
    console.log("✅ Email connection successful")
    return { success: true, message: "Email connection verified" }
  } catch (error) {
    console.error("❌ Email connection failed:", error)
    return { success: false, error: error.message }
  }
}

// Send test email
export const sendTestEmail = async (to) => {
  console.log(`🧪 Sending test email to: ${to}`)
  return await sendEmail(to, "testEmail", {})
}

// Create account for guest user
export const createAccountForGuest = async (supportRequest) => {
  try {
    const User = (await import("../models/User.js")).default

    console.log("🔍 Creating account for guest user...")
    console.log("Guest email:", supportRequest.guestEmail)
    console.log("Guest name:", supportRequest.guestName)

    // Check if user already exists
    const existingUser = await User.findOne({ email: supportRequest.guestEmail })
    if (existingUser) {
      console.log("👤 User already exists, linking request to existing account")

      // Link request to existing user
      supportRequest.customer = existingUser._id
      supportRequest.isGuestRequest = false
      await supportRequest.save()

      return null // No new account created
    }

    // Generate secure credentials
    const securePassword = generateSecurePassword(12)
    const username = generateUsername(
      supportRequest.guestEmail,
      supportRequest.guestName?.split(" ")[0] || "",
      supportRequest.guestName?.split(" ")[1] || "",
    )

    console.log("🔐 Generated credentials for new user")

    // Create new user account
    const newUser = new User({
      email: supportRequest.guestEmail,
      password: securePassword, // Will be hashed by pre-save hook
      firstName: supportRequest.guestName?.split(" ")[0] || "Guest",
      lastName: supportRequest.guestName?.split(" ").slice(1).join(" ") || "User",
      phone: supportRequest.guestPhone || "Not provided",
      accountType: "individual",
      username: username,
    })

    await newUser.save()
    console.log("✅ New user account created successfully")

    // Link support request to new user
    supportRequest.customer = newUser._id
    supportRequest.isGuestRequest = false // Convert to regular request
    await supportRequest.save()

    console.log("✅ Support request linked to new user account")

    return {
      email: supportRequest.guestEmail,
      username: username,
      password: securePassword,
      userId: newUser._id,
    }
  } catch (error) {
    console.error("❌ Failed to create account for guest:", error)
    throw error
  }
}

// Send account creation notification
export const sendAccountCreationNotification = async (accountInfo, supportRequest = null) => {
  console.log("📧 Sending account creation notification...")
  return await sendEmail(accountInfo.email, "accountCreated", accountInfo, supportRequest)
}

// Send request approval notification
export const sendGuestApprovalNotification = async (supportRequest, accountInfo = null) => {
  console.log("🔍 Checking if should send approval notification...")
  console.log("Guest email:", supportRequest.guestEmail)
  console.log("Account info:", accountInfo ? "provided" : "not provided")

  if (supportRequest.guestEmail) {
    console.log("✅ Sending approval notification...")
    return await sendEmail(supportRequest.guestEmail, "requestApproved", supportRequest, accountInfo)
  }

  console.log("❌ No email address provided")
  return { success: false, error: "No email address provided" }
}

// Export utility functions
export { generateSecurePassword, generateUsername }
