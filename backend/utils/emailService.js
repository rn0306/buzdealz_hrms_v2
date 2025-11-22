// utils/emailService.js
const nodemailer = require('nodemailer');

function createTransport() {
  
  if (process.env.ZOHO_EMAIL_USER && process.env.ZOHO_EMAIL_PASS) {
    console.log('📨 Using Zoho Mail SMTP configuration...');
    return nodemailer.createTransport({
      host: 'smtp.zoho.in', 
      port: 465,
      secure: true, 
      auth: {
        user: process.env.ZOHO_EMAIL_USER, 
        pass: process.env.ZOHO_EMAIL_PASS, 
      },
      tls: {
        rejectUnauthorized: false, // ⛔ Only for development
      },
    });
  }

  throw new Error('❌ No valid email transport configuration found in environment variables');
}

const transporter = createTransport();

exports.sendMail = async (to, subject, html, fromName = 'HRMS System', attachments = []) => {
  try {
    const fromAddress =
      process.env.ZOHO_EMAIL_USER ||
      process.env.MAIL_USER ||
      'noreply@yourdomain.com';

    await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      html,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
    });

    console.log(`✅ Email sent successfully to: ${to}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Mail send failed:', error.message);
    return { success: false, error: error.message };
  }
};
