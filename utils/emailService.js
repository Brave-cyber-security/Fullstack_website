import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

// Email templates
const emailTemplates = {
  guestRequestApproved: (supportRequest) => ({
    subject: `✅ Your Support Request #${supportRequest._id.toString().slice(-8)} has been Approved`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">✅ Request Approved!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your support request has been approved by our master technician</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Request Details</h2>
            <p><strong>Request ID:</strong> #${supportRequest._id.toString().slice(-8)}</p>
            <p><strong>Title:</strong> ${supportRequest.title}</p>
            <p><strong>Device Type:</strong> ${supportRequest.deviceType}</p>
            <p><strong>Urgency:</strong> ${supportRequest.urgency}</p>
            ${supportRequest.masterSetPrice ? `<p><strong>Approved Price:</strong> $${supportRequest.masterSetPrice}</p>` : ""}
            ${supportRequest.masterComments ? `<p><strong>Master Comments:</strong> ${supportRequest.masterComments}</p>` : ""}
          </div>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
            <h3 style="color: #155724; margin-top: 0;">What's Next?</h3>
            <ul style="color: #155724; margin: 0; padding-left: 20px;">
              <li>Your request will be assigned to a technician shortly</li>
              <li>You'll receive another email with appointment details</li>
              <li>Our team will contact you within 24 hours</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #666; margin: 0;">Need help? Contact us at <a href="mailto:support@dern-support.com" style="color: #007bff;">support@dern-support.com</a></p>
          </div>
        </div>
      </div>
    `,
    text: `
      Your Support Request #${supportRequest._id.toString().slice(-8)} has been Approved!
      
      Request Details:
      - Title: ${supportRequest.title}
      - Device Type: ${supportRequest.deviceType}
      - Urgency: ${supportRequest.urgency}
      ${supportRequest.masterSetPrice ? `- Approved Price: $${supportRequest.masterSetPrice}` : ""}
      ${supportRequest.masterComments ? `- Master Comments: ${supportRequest.masterComments}` : ""}
      
      What's Next?
      - Your request will be assigned to a technician shortly
      - You'll receive another email with appointment details
      - Our team will contact you within 24 hours
      
      Need help? Contact us at support@dern-support.com
    `,
  }),

  guestRequestRejected: (supportRequest) => ({
    subject: `❌ Your Support Request #${supportRequest._id.toString().slice(-8)} Update`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">Request Update</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">We have an update regarding your support request</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <div style="background: white; padding: 25px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Request Details</h2>
            <p><strong>Request ID:</strong> #${supportRequest._id.toString().slice(-8)}</p>
            <p><strong>Title:</strong> ${supportRequest.title}</p>
            <p><strong>Device Type:</strong> ${supportRequest.deviceType}</p>
            <p><strong>Urgency:</strong> ${supportRequest.urgency}</p>
          </div>
          
          <div style="background: #f8d7da; padding: 20px; border-radius: 8px; border-left: 4px solid #dc3545;">
            <h3 style="color: #721c24; margin-top: 0;">Update Information</h3>
            <p style="color: #721c24; margin: 0;">Unfortunately, we cannot proceed with your request at this time.</p>
            ${supportRequest.rejectionReason ? `<p style="color: #721c24; margin: 10px 0 0 0;"><strong>Reason:</strong> ${supportRequest.rejectionReason}</p>` : ""}
            ${supportRequest.masterComments ? `<p style="color: #721c24; margin: 10px 0 0 0;"><strong>Additional Comments:</strong> ${supportRequest.masterComments}</p>` : ""}
          </div>
          
          <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; border-left: 4px solid #bee5eb; margin-top: 20px;">
            <h3 style="color: #0c5460; margin-top: 0;">Alternative Options</h3>
            <ul style="color: #0c5460; margin: 0; padding-left: 20px;">
              <li>You can submit a new request with updated information</li>
              <li>Contact us directly for personalized assistance</li>
              <li>Check our knowledge base for self-help resources</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/guest-support" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Submit New Request
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #666; margin: 0;">Need help? Contact us at <a href="mailto:support@dern-support.com" style="color: #007bff;">support@dern-support.com</a></p>
          </div>
        </div>
      </div>
    `,
    text: `
      Your Support Request #${supportRequest._id.toString().slice(-8)} Update
      
      Request Details:
      - Title: ${supportRequest.title}
      - Device Type: ${supportRequest.deviceType}
      - Urgency: ${supportRequest.urgency}
      
      Unfortunately, we cannot proceed with your request at this time.
      ${supportRequest.rejectionReason ? `Reason: ${supportRequest.rejectionReason}` : ""}
      ${supportRequest.masterComments ? `Additional Comments: ${supportRequest.masterComments}` : ""}
      
      Alternative Options:
      - You can submit a new request with updated information
      - Contact us directly for personalized assistance
      - Check our knowledge base for self-help resources
      
      Submit a new request: ${process.env.FRONTEND_URL || "http://localhost:3000"}/guest-support
      Need help? Contact us at support@dern-support.com
    `,
  }),
}

// Send email function
export const sendEmail = async (to, template, data) => {
  try {
    const transporter = createTransporter()
    const emailContent = emailTemplates[template](data)

    const mailOptions = {
      from: `"Dern Support" <${process.env.SMTP_USER}>`,
      to: to,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    }

    const result = await transporter.sendMail(mailOptions)
    console.log("✅ Email sent successfully:", result.messageId)
    return { success: true, messageId: result.messageId }
  } catch (error) {
    console.error("❌ Email sending failed:", error)
    return { success: false, error: error.message }
  }
}

// Send notification for guest request approval
export const sendGuestApprovalNotification = async (supportRequest) => {
  if (supportRequest.isGuestRequest && supportRequest.guestEmail) {
    return await sendEmail(supportRequest.guestEmail, "guestRequestApproved", supportRequest)
  }
  return { success: false, error: "Not a guest request or no email provided" }
}

// Send notification for guest request rejection
export const sendGuestRejectionNotification = async (supportRequest) => {
  if (supportRequest.isGuestRequest && supportRequest.guestEmail) {
    return await sendEmail(supportRequest.guestEmail, "guestRequestRejected", supportRequest)
  }
  return { success: false, error: "Not a guest request or no email provided" }
}
