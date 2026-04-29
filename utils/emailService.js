const nodemailer = require("nodemailer");

// Create transporter with proper Gmail settings
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Test connection on startup
const verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email service configured successfully");
  } catch (error) {
    console.error("❌ Email service error:", error.message);
  }
};

verifyConnection();

// Send registration confirmation email to student
const sendRegistrationEmail = async (userEmail, userName) => {
  try {
    const mailOptions = {
      from: `"My Drone Force" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "🎉 Welcome to My Drone Force! Registration Successful",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #0066cc, #00a3ff); padding: 30px; text-align: center; color: white; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #0066cc; color: white; padding: 12px 30px; text-decoration: none; border-radius: 50px; margin-top: 20px; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚁 Welcome to My Drone Force!</h1>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>Thank you for registering with <strong>My Drone Force</strong>! Your registration has been successfully completed.</p>
              <p>You are now part of America's leading drone training and certification provider. Get ready to launch your drone career!</p>
              <h3>What's Next?</h3>
              <ul>
                <li>📚 Access your course materials</li>
                <li>🎓 Get FAA Part 107 certified</li>
                <li>💼 Connect with job placement partners</li>
                <li>🚁 Start your drone career journey</li>
              </ul>
              <a href="https://mydroneforce.com" class="button">Visit Our Website</a>
            </div>
            <div class="footer">
              <p>&copy; 2024 My Drone Force. All rights reserved.</p>
              <p>300 South Spring Street, Little Rock, AR 72201</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Registration email sent to:", userEmail);
    return true;
  } catch (error) {
    console.error("❌ Registration email error:", error.message);
    return false;
  }
};

// Send admin notification for new registration (supports multiple admins)
const sendAdminNotification = async (userData) => {
  try {
    // Handle multiple admin emails (comma-separated)
    let adminEmails = process.env.ADMIN_EMAIL;
    if (!adminEmails) {
      console.error("❌ ADMIN_EMAIL environment variable not set");
      return false;
    }

    // Split by comma and clean up whitespace
    const recipientList = adminEmails.split(",").map((email) => email.trim());

    const mailOptions = {
      from: `"My Drone Force" <${process.env.EMAIL_USER}>`,
      to: recipientList,
      subject: "📝 New Student Registration",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2 style="color: #0066cc;">🚁 New Student Registration</h2>
          <p>A new student has registered on My Drone Force.</p>
          <table style="border-collapse: collapse; width: 100%; margin: 15px 0;">
            <tr>
              <td style="padding: 10px; background: #f5f5f5; width: 120px;"><strong>Name:</strong></td>
              <td style="padding: 10px;">${userData.firstName} ${userData.lastName}</td>
            </tr>
            <tr>
              <td style="padding: 10px;"><strong>Email:</strong></td>
              <td style="padding: 10px;">${userData.email}</td>
            </tr>
            <tr>
              <td style="padding: 10px; background: #f5f5f5;"><strong>Phone:</strong></td>
              <td style="padding: 10px;">${userData.phone}</td>
            </tr>
            <tr>
              <td style="padding: 10px;"><strong>Course:</strong></td>
              <td style="padding: 10px;">${userData.courseInterest}</td>
            </tr>
          </table>
          <p>
            <a href="https://mydroneforce.com/admin/dashboard" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Admin Dashboard →
            </a>
          </p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;" />
          <p style="font-size: 12px; color: #666;">My Drone Force | 300 South Spring Street, Little Rock, AR 72201</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(
      `✅ Admin notification sent to ${recipientList.length} recipients`,
    );
    return true;
  } catch (error) {
    console.error("❌ Admin notification error:", error.message);
    return false;
  }
};

module.exports = { sendRegistrationEmail, sendAdminNotification };
