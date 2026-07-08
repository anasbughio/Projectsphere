const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const emailUser = process.env.BREVO_SMTP_USER;
  const emailPass = process.env.BREVO_SMTP_PASS;

  if (!emailUser || !emailPass) {
    console.error("---> ❌ BREVO CREDENTIALS MISSING IN ENV");
    throw new Error('Brevo credentials missing');
  }

  // Brevo SMTP Configuration
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587, // Render port 587 allow karta hai Brevo ke liye
    secure: false, // Port 587 ke liye false hota hai
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const mailOptions = {
    // Note: 'from' mein wahi email likhein jis se Brevo account banaya hai
    from: `"ProjectSphere" <anasbughio@gmail.com>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  try {
    console.log("---> ⏳ Sending Email via Brevo to:", options.email);
    const info = await transporter.sendMail(mailOptions);
    console.log('---> ✅ Email sent successfully via Brevo! ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('---> ❌ Brevo SMTP Error:', error);
    throw error;
  }
};

module.exports = sendEmail;