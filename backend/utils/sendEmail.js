const { Resend } = require('resend');

const sendEmail = async (options) => {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error("---> ❌ RESEND_API_KEY IS MISSING IN ENV");
    throw new Error('Resend API key missing');
  }

  const resend = new Resend(resendApiKey);

  try {
    console.log("---> ⏳ Sending Email via Resend API to:", options.email);
    
    const data = await resend.emails.send({
      // Resend Free Tier par 'from' email yahi hoti hai:
      from: 'ProjectSphere <onboarding@resend.dev>', 
      to: options.email,
      subject: options.subject,
      html: options.html,
    });
    
    console.log('---> ✅ Email sent successfully via Resend API! ID:', data.id);
    return data;
  } catch (error) {
    console.error('---> ❌ Resend API Error:', error);
    throw error;
  }
};

module.exports = sendEmail;