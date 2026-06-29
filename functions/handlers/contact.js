/* functions/handlers/contact.js */
const nodemailer = require("nodemailer");

const CONTACT_INBOX = "unspace.pu@gmail.com";

const TOPIC_LABELS = {
  general: "General Help",
  bug: "Bug Report",
  report_user: "User/Scam Report",
};

function createTransport(gmailUser, gmailPass) {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
  });
}

async function sendContactEmail(data, gmailUser, gmailPass) {
  const transporter = createTransport(gmailUser, gmailPass);
  const topicLabel = TOPIC_LABELS[data.topic] || data.topic || "General";

  const subject = `[Unspace Contact] ${topicLabel} from ${data.name}`;
  const text = [
    "New contact form submission on Unspace",
    "",
    `Topic: ${topicLabel}`,
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.reportedUrl ? `Reported URL: ${data.reportedUrl}` : null,
    "",
    "Message:",
    data.message,
    "",
    "Reply directly to this email to respond to the user.",
  ].filter(Boolean).join("\n");

  await transporter.sendMail({
    from: `"Unspace Contact" <${gmailUser}>`,
    to: CONTACT_INBOX,
    replyTo: data.email,
    subject,
    text,
  });
}

async function onContactMessageCreated(event, gmailUser, gmailPass) {
  const snapshot = event.data;
  if (!snapshot) return;

  const data = snapshot.data();
  if (!data?.email || !data?.message) {
    console.warn("Contact message missing required fields, skipping email");
    return;
  }

  if (!gmailUser || !gmailPass) {
    console.error("GMAIL_USER or GMAIL_APP_PASSWORD secret not configured");
    return;
  }

  try {
    await sendContactEmail(data, gmailUser, gmailPass);
    console.log(`Contact email sent for message ${snapshot.id}`);
  } catch (err) {
    console.error("Failed to send contact email:", err);
  }
}

module.exports = { onContactMessageCreated };
