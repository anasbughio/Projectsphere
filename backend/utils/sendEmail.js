const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    const error = new Error('Email SMTP credentials are missing. Set EMAIL_USER and EMAIL_PASS in your production environment.');
    console.error(error.message);
    throw error;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    requireTLS: true,
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"ProjectSphere" <${emailUser}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send failed:', error);

    if (error.responseCode === 535 || error.code === 'EAUTH') {
      console.error('SMTP authentication failed. For Gmail, use an app password instead of your normal password.');
    }

    throw error;
  }
};

module.exports = sendEmail;