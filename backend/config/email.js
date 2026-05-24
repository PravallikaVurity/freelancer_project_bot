const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: parseInt(process.env.EMAIL_PORT) === 465,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS ||
      process.env.EMAIL_USER === "your_email@gmail.com") {
    console.error("[Email] EMAIL_USER or EMAIL_PASS not configured in .env");
    const err = new Error("Email service unavailable");
    err.statusCode = 503;
    throw err;
  }
  try {
    await transporter.sendMail({
      from: `"Freelancer Board" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}`);
  } catch (smtpErr) {
    console.error("[Email] SMTP error:", smtpErr.message);
    const err = new Error("Email service unavailable");
    err.statusCode = 503;
    throw err;
  }
};

module.exports = sendEmail;
