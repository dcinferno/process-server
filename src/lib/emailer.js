import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: false, // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMagicLinkEmail(email, magicLink, clientName) {
  const mailOptions = {
    from: '"Agent Web Services - DSM" <no-reply@agentwebservices.com>',
    to: email,
    subject: "Process Service - Secure Link for Document Upload & Payment",
    html: `
      <p>Hello ${clientName},</p>
      <p>Click the secure link below to complete your request:</p>
      <a href="${magicLink}">${magicLink}</a>
      <p>This link will expire in 30 minutes.</p>
    `,
  };

  const info = await transporter.sendMail(mailOptions);

  if (process.env.NODE_ENV === "development") {
    console.log("Email sent:", info.messageId);
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info)); // Ethereal preview link only in dev
  }
}
