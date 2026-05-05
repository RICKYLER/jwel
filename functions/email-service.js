const nodemailer = require('nodemailer')

// Load environment variables
const EMAIL_USER = process.env.EMAIL_USER || 'laliojames02@gmail.com'
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD || 'xbtmlxpltzglbgru'

// Configure Nodemailer transporter with Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASSWORD,
  },
})

// Generate a random verification code
const generateVerificationCode = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Send verification email
const sendVerificationEmail = async (email, verificationCode) => {
  const encodedEmail = encodeURIComponent(email)
  const verificationLink = `https://bykelink-system.web.app/?verification=${verificationCode}&email=${encodedEmail}`
  
  const mailOptions = {
    from: `BYKELINK <${EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email for BYKELINK Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0;">BYKELINK Motors</h1>
        </div>
        
        <div style="background: #f8f9fa; padding: 40px 20px; border-radius: 0 0 8px 8px;">
          <h2 style="color: #333; text-align: center;">Verify Your Email</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for creating your BYKELINK account! To complete your registration, please verify your email address by clicking the button below.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background: linear-gradient(135deg, #ff5540 0%, #ff2e1f 100%); color: white; padding: 12px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #999; font-size: 14px; text-align: center;">
            Or copy and paste this link in your browser:<br>
            <a href="${verificationLink}" style="color: #667eea; word-break: break-all;">${verificationLink}</a>
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px;">
            This link will expire in 24 hours. If you didn't create a BYKELINK account, please ignore this email.
          </p>
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            BYKELINK Motor Inc. © 2026
          </p>
        </div>
      </div>
    `,
  }

  return transporter.sendMail(mailOptions)
}

module.exports = {
  generateVerificationCode,
  sendVerificationEmail,
}
