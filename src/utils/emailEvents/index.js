import { EventEmitter } from "events";
import { generateToken } from "../token/generateToken.js";
import { sendEmail } from "../../service/sendEmail.service.js";

export const eventEmitter = new EventEmitter();

eventEmitter.on("sendEmail", async (data) => {
  const { email } = data;

  // send link confirmation
  const token = await generateToken({
    payload: { email },
    SIGNATURE: process.env.SIGNATURE,
    options: {
      expiresIn: 60 * 3,
    },
  });
  const link = `http://localhost:3000/users/confirmEmail/${token}`;

  const isSent = await sendEmail({
    to: email,
    subject: "confirm email",
    html: `<a href="${link}">confirm email</a>`,
  });

  if (!isSent) {
    throw new Error("fail to send email", { cause: 400 });
  }
});

eventEmitter.on("forgetPassword", async (data) => {
  const { email, otp } = data;

  // send otp confirmation
  const isSent = await sendEmail({
    to: email,
    subject: "forget password",
    html: `<h1>otp:${otp}</h1>`,
  });

  if (!isSent) {
    throw new Error("fail to send email", { cause: 400 });
  }
});
