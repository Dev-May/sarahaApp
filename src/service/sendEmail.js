import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html, attachments }) => {
  const transporter = nodemailer.createTransport({
    port: 465,
    secure: true,
    service: "gmail",
    auth: {
      user: "mai.eldhrawy@gmail.com",
      pass: "kgtrgmfjuturhurt",
    },
  });

  const info = await transporter.sendMail({
    from: '"May 👀" <mai.eldhrawy@gmail.email>',
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
