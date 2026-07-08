const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error('Email credentials missing in Render Environment');
  }

  // Sirf service: 'Gmail' likhne se Nodemailer khud best Host, Port aur Secure settings pick kar leta hai!
  const transporter = nodemailer.createTransport({
    service: 'Gmail', 
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  const mailOptions = {
    from: `"ProjectSphere" <${emailUser}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent instantly:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send failed:', error);
    throw error;
  }
};

module.exports = sendEmail;