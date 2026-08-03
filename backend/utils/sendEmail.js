const sendEmail = async (options) => {
  const apiKey = process.env.BREVO_API_KEY;

  if (!apiKey) {
    console.error("---> ❌ BREVO_API_KEY IS MISSING IN ENV");
    throw new Error('Brevo API key missing');
  }

  const url = 'https://api.brevo.com/v3/smtp/email';
  
  // Brevo API data format
  const payload = {
    sender: {
      name: "ProjectSphere",
      email: "anasbughio@gmail.com" // verified email
    },
    to: [{ email: options.email }],
    subject: options.subject,
    htmlContent: options.html
  };

  try {
    console.log("---> ⏳ Sending Email via Brevo HTTP API to:", options.email);
    
    // API Call (Bypass Render's SMTP Block)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    // if bravo reject for some reason
    if (!response.ok) {
      console.error('---> ❌ Brevo API Rejected:', data);
      throw new Error(data.message || 'Email sending failed');
    }

    console.log('---> ✅ Email sent successfully via Brevo API! Message ID:', data.messageId);
    return data;

  } catch (error) {
    console.error('---> ❌ Exact API Error:', error);
    throw error;
  }
};

module.exports = sendEmail;