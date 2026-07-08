const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.error("---> ❌ EMAIL CREDENTIALS MISSING IN ENV");
    throw new Error('Email credentials missing');
  }

  console.log("---> 🔄 Configuring Mail Transporter...");
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    // 👉 YEH DO LINES SARA RAHAZ KHOL DENGY
    logger: true, 
    debug: true,
    // Render connection issues ke liye
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `"ProjectSphere" <${emailUser}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  try {
    console.log("---> ⏳ Starting to send mail...");
    const info = await transporter.sendMail(mailOptions);
    console.log('---> ✅ Email sent out of Node:', info.messageId);
    return info;
  } catch (error) {
    console.error('---> ❌ Exact Nodemailer Error:', error);
    throw error;
  }
};

module.exports = sendEmail;