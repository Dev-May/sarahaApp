import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html, attachments }) => {
  const transporter = nodemailer.createTransport({
    port: 465,
    secure: true,
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  const info = await transporter.sendMail({
    from: `"May 👀" <${process.env.EMAIL}>`,
    to: to || "maieddahrawy@outlook.com",
    subject: subject || "Hello ✔",
    // text: text || "Hello world?", // plain‑text body
    html: html || "<b>Hello world?</b>", // HTML body
    attachments: attachments || [],
  });

  if (info.accepted.length > 0) {
    return true;
  } else {
    return false;
  }
};
