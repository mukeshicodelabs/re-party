const mailchimp = require('@mailchimp/mailchimp_transactional');

// Instead of setConfig, you initialize directly with API key
const mandrillClient = mailchimp(process.env.MAILCHIMP_API_KEY);
// Endpoint to send an email to a single user
const sendMail = async (req, res) => {
  const {
    email = "",
    firstName = "",
    lastName = "",
    message = "",
    subscribe = false
  } = req.body;

  let subject;
  let htmlContent;

  if (subscribe) {
    // Subscription email content
    subject = `New Newsletter Subscription`;
    htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color: #4CAF50;">New Subscriber</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p style="font-size: 12px; color: #777;">
          This email address just subscribed to your newsletter.
        </p>
      </div>
    `;
  } else {
    // Contact form email content
    subject = `New message from ${firstName} ${lastName}`;
    htmlContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color: #4CAF50;">New Inquiry from Marketplace</h2>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <hr style="margin: 20px 0;">
        <p>${message.replace(/\n/g, "<br>")}</p>
        <hr style="margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">
          This message was submitted via the LetsReParty contact form.
        </p>
      </div>
    `;
  }

  const mailMessage = {
    from_email: subscribe ? "no-reply@letsreparty.com" : email || "no-reply@letsreparty.com",
    subject,
    html: htmlContent,
    to: [{ email: "hello@letsreparty.com", type: "to" }],
    headers: { "Reply-To": email }
  };

  try {
    const response = await mandrillClient.messages.send({ message: mailMessage });
    console.log("✅ Email sent via Mandrill:", response);

    return res.status(200).json({ message: "Email sent successfully" });
  } catch (err) {
    console.error("❌ Error sending email:", err);
    return res.status(400).json({ message: "Email not sent", error: err });
  }
};

module.exports = { sendMail };


module.exports = {
  sendMail
}
