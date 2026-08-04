const nodemailer = require('nodemailer');

// Configure your SMTP transporter
// Make sure to add EMAIL_USER and EMAIL_PASS to your .env file
const transporter = nodemailer.createTransport({
  service: 'gmail', // Use 'sendgrid' if using SendGrid, or your SMTP host
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendClientReportEmail = async (to, subject, htmlContent) => {
  try {
    await transporter.sendMail({
      from: `"ProjectSphere Automated Updates" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    });
    console.log(`Weekly report sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
};