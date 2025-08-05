import userModel, { userRoles } from "../../DB/models/user.model.js";
import bcrypt from "bcrypt";
import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../service/sendEmail.js";
// import nanoid from "nanoid";

// ==================== Sign Up ====================
export const signUp = async (req, res, next) => {
  const { name, email, password, cPassword, phone, gender, age } = req.body;

  // Check email
  if (await userModel.findOne({ email })) {
    throw new Error("user already exist", { cause: 409 });
  }

  // Hash password
  const hash = bcrypt.hashSync(password, 10);

  // Encrypt phone
  let encryptPhone = CryptoJS.AES.encrypt(phone, "may__123").toString();

  // Send link to confirm email
  const token = jwt.sign({ email }, "may_confirmed", { expiresIn: 60 * 3 });
  const link = `http://localhost:3000/users/confirmEmail/${token}`;

  const isSent = await sendEmail({
    to: email,
    html: `<a href="${link}">confirm email</a>`,
  });

  if (!isSent) {
    throw new Error("fail to send email", { cause: 400 });
  }

  const user = await userModel.create({
    name,
    email,
    password: hash,
    phone: encryptPhone,
    gender,
    age,
  });

  return res.status(201).json({ message: "created successfully", user });
};

// ==================== confirmEmail ====================
export const confirmEmail = async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    throw new Error("Token Not Exist", { cause: 400 });
  }

  const decoded = jwt.verify(token, "may_confirmed");
  if (!decoded?.email) {
    throw new Error("InValid Token", { cause: 400 });
  }

  const user = await userModel.findOne({
    email: decoded.email,
    confirmed: false,
  });

  if (!user) {
    throw new Error("user not exist or already confirmed", { cause: 404 });
  }

  user.confirmed = true;
  await user.save();

  return res.status(200).json({ message: "confirmed success" });
};

// ==================== Sign In ====================
export const signIn = async (req, res, next) => {
  const { email, password } = req.body;

  // Check email
  const user = await userModel.findOne({ email, confirmed: true });
  if (!user) {
    throw new Error("user not exist or already confirmed", { cause: 404 });
  }

  // Compare password
  const match = bcrypt.compareSync(password, user.password);
  if (!match) {
    throw new Error("InValid Password", { cause: 400 });
  }

  // Create token
  const access_token = jwt.sign(
    { id: user._id, email },
    user.role == userRoles.user ? "may__123" : "may__123__admin",
    {
      expiresIn: 60 * 30,
    }
  );

  const refresh_token = jwt.sign(
    { id: user._id, email },
    user.role == userRoles.user ? "may__mmm__123" : "may__mmm__admin123",
    {
      expiresIn: "1y",
    }
  );

  return res
    .status(200)
    .json({ message: "success", access_token, refresh_token });
};

// ==================== get profile ====================
export const getProfile = async (req, res, next) => {
  // Decrypt phone
  const phone = CryptoJS.AES.decrypt(req.user.phone, "may__123").toString(
    CryptoJS.enc.Utf8
  );
  req.user.phone = phone;

  return res.status(200).json({ message: "success", user: req.user });
};

// ==================== forgetPassword ====================
export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) {
    throw new Error("email not exists", { cause: 404 });
  }

  const otp = customAlphabet("0123456789", 6);

  eventEmitter.emit("forgetPassword", { email, otp });

  user.otp = await Hash({ plainText: otp });

  await user.save();
  return res.status(200).json({ message: "success" });
};

// ==================== resetPassword ====================
export const resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  const user = await userModel.findOne({ email, otp: { $exists: true } });
  if (!user) {
    throw new Error("email not exists", { cause: 404 });
  }

  if (!(await compare({ plainText: otp, cipherText: user?.otp }))) {
    throw new Error("InValid otp", { cause: 400 });
  }

  const hash = await Hash({ plainText: newPassword });

  await userModel.updateOne(
    { email: user.email },
    {
      password: hash,
      $unset: { otp: "" },
    }
  );

  return res.status(200).json({ message: "success" });
};
