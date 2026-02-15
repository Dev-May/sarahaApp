import userModel, { userRoles } from "../../DB/models/user.model.js";
import { nanoid, customAlphabet } from "nanoid";
import {
  generateToken,
  verifyToken,
  Hash,
  Compare,
  Encrypt,
  Decrypt,
  eventEmitter,
} from "../../utils/index.js";
import cloudinary from "../../utils/cloudinary/index.js";
import revokeTokenModel from "../../DB/models/revoke-token.model.js";
import OAuth2Client from "google-auth-library";

// ==================== Sign Up ====================
export const signUp = async (req, res, next) => {
  const { name, email, password, phone, gender, age } = req.body;

  const arrPaths = [];
  for (const file of req?.files) {
    // [{}, {}]
    const { secure_url, public_id } = await cloudinary.uploader.upload(
      file?.path,
      {
        folder: `sarahaApp/users/coverImages`,
      },
    );
    arrPaths.push({ secure_url, public_id });
  }

  // const { secure_url, public_id } = await cloudinary.uploader.upload(
  //   req?.file?.path,
  //   {
  //     folder: "sarahaApp/users/profileImage",
  //   },
  // );

  // const {secure_url, public_id} = await cloudinary.uploader.upload(req?.files?.path, {
  //   folder: "sarahaApp/users",
  //   // public_id: "may",
  //   // use_filename: true,
  //   // unique_filename: false,
  //   // resource_type: "auto",
  // });

  // Check email
  if (await userModel.findOne({ email })) {
    throw new Error("user already exist", { cause: 409 });
  }

  // Hash password
  const hash = await Hash({
    plainText: password,
    SALT_ROUNDS: process.env.SALT_ROUNDS,
  });

  // Encrypt phone
  let encryptPhone = await Encrypt({
    plainText: phone,
    SECRET_KEY: process.env.SECRET_KEY,
  });

  // Send email confirmation
  eventEmitter.emit("sendEmail", { email });

  // const arrPaths = [];
  // // uploads file
  // for (const file of req?.files) {
  //   arrPaths.push(file?.path);
  // }

  const user = await userModel.create({
    name,
    email,
    password: hash,
    phone: encryptPhone,
    gender,
    age,
    // profileImage: { secure_url, public_id },
    coverImages: arrPaths, // req?.files?.map((file) => file.path),
  });
  await user.save();

  return res.status(201).json({ message: "created successfully", user });
};

// ==================== confirmEmail ====================
export const confirmEmail = async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    throw new Error("Token Not Exist", { cause: 400 });
  }

  const decoded = await verifyToken({
    token,
    SIGNATURE: process.env.SIGNATURE,
  });
  if (!decoded?.email) {
    throw new Error("InValid Token", { cause: 409 });
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
    throw new Error("user not exists or not confirmed", { cause: 404 });
  }

  // Compare password
  if (!(await Compare({ plainText: password, cipherText: user.password }))) {
    throw new Error("InValid Password", { cause: 409 });
  }

  // Create token
  const access_token = await generateToken({
    payload: { id: user._id, email: user.email },
    SIGNATURE:
      user.role == userRoles.user
        ? process.env.ACCESS_TOKEN_USER
        : process.env.ACCESS_TOKEN_ADMIN,
    options: {
      expiresIn: 60 * 60,
      jwtid: nanoid(),
    },
  });

  const refresh_token = await generateToken({
    payload: { id: user._id, email: user.email },
    SIGNATURE:
      user.role == userRoles.user
        ? process.env.REFRESH_TOKEN_USER
        : process.env.REFRESH_TOKEN_ADMIN,
    options: {
      expiresIn: "1y",
      jwtid: nanoid(),
    },
  });

  return res
    .status(200)
    .json({ message: "success", access_token, refresh_token });
};

// ==================== login with gmail ====================
export const loginWithGmail = async (req, res, next) => {
  const { idToken } = req.body;

  const client = new OAuth2Client();
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.WEB_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  }
  const { email, name, picture, email_verified } = await verify();

  // Check email
  let user = await userModel.findOne({ email });
  if (!user) {
    user = await userModel.create({
      name,
      email,
      confirmed: email_verified,
      image: picture,
      password: nanoid(), // random password
      provider: userProviders.google,
    });
  }

  if (user.provider !== userProviders.google) {
    throw new Error("please login with your email and password");
  }

  // Create token
  const access_token = await generateToken({
    payload: { id: user._id, email: user.email },
    SIGNATURE:
      user.role == userRoles.user
        ? process.env.ACCESS_TOKEN_USER
        : process.env.ACCESS_TOKEN_ADMIN,
    options: {
      expiresIn: 60 * 60,
      jwtid: nanoid(),
    },
  });

  const refresh_token = await generateToken({
    payload: { id: user._id, email: user.email },
    SIGNATURE:
      user.role == userRoles.user
        ? process.env.REFRESH_TOKEN_USER
        : process.env.REFRESH_TOKEN_ADMIN,
    options: {
      expiresIn: "1y",
      jwtid: nanoid(),
    },
  });

  return res
    .status(200)
    .json({ message: "success", access_token, refresh_token });
};

// ==================== get profile ====================
export const getProfile = async (req, res, next) => {
  // Decrypt phone
  const phone = await Decrypt({
    cipherText: req.user.phone,
    SECRET_KEY: process.env.SECRET_KEY,
  });
  req.user.phone = phone;

  return res.status(200).json({ message: "success", user: req.user });
};

// ==================== get profile data ====================
export const getProfileData = async (req, res, next) => {
  const { id } = req.params;
  const user = await userModel
    .findById(id)
    .select("-password -role -confirmed -phone -createdAt -updatedAt");
  if (!user) {
    throw new Error("user not exists", { cause: 404 });
  }

  return res.status(200).json({ message: "success", user });
};

// ==================== logout ====================
export const logout = async (req, res, next) => {
  const revokeToken = await revokeTokenModel.create({
    tokenId: req.decoded.jti,
    expireAt: req.decoded.exp,
  });

  return res.status(200).json({ message: "success", revokeToken });
};

// ==================== refresh token ====================
export const refreshToken = async (req, res, next) => {
  const { authorization } = req.headers;

  const [prefix, token] = authorization.split(" ") || [];
  if (!prefix || !token) {
    throw new Error("Token Not Exist", { cause: 400 });
  }

  let signature = "";
  if (prefix == process.env.BEARER_USER) {
    signature = process.env.REFRESH_TOKEN_USER;
  } else if (prefix == process.env.BEARER_ADMIN) {
    signature = process.env.REFRESH_TOKEN_ADMIN;
  } else {
    throw new Error("InValid prefix Token", { cause: 400 });
  }

  // Verify token
  const decoded = await verifyToken({ token, SIGNATURE: signature });
  if (!decoded?.email) {
    throw new Error("InValid Token", { cause: 400 });
  }

  const revoked = await revokeTokenModel.findOne({ tokenId: decoded.jti });
  4;
  if (revoked) {
    throw new Error("please log in again", { cause: 400 });
  }

  // Check user exist
  const user = await userModel.findOne({ email: decoded.email });
  4;
  if (!user) {
    throw new Error("user not exists", { cause: 404 });
  }

  // Create token
  const access_token = await generateToken({
    payload: { id: user._id, email: user.email },
    SIGNATURE:
      user.role == userRoles.user
        ? process.env.ACCESS_TOKEN_USER
        : process.env.ACCESS_TOKEN_ADMIN,
    options: {
      expiresIn: 60 * 60,
      jwtid: nanoid(),
    },
  });

  const refresh_token = await generateToken({
    payload: { id: user._id, email: user.email },
    SIGNATURE:
      user.role == userRoles.user
        ? process.env.REFRESH_TOKEN_USER
        : process.env.REFRESH_TOKEN_ADMIN,
    options: {
      expiresIn: "1y",
      jwtid: nanoid(),
    },
  });

  return res
    .status(200)
    .json({ message: "success", access_token, refresh_token });
};

// ==================== update password ====================
export const updatePassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (
    !(await Compare({ plainText: oldPassword, cipherText: req.user.password }))
  ) {
    throw new Error("InValid old password", { cause: 400 });
  }

  const hash = await Hash({ plainText: newPassword });
  req.user.password = hash;
  await req.user.save();

  await revokeTokenModel.create({
    tokenId: req?.decoded?.jti,
    expireAt: req?.decoded?.exp,
  });

  return res.status(200).json({ message: "success", user: req.user });
};

// ==================== forget password ====================
export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) {
    throw new Error("user not exist", { cause: 404 });
  }

  const otp = customAlphabet("0123456789", 6)();

  // send email with otp
  eventEmitter.emit("forgetPassword", {
    email,
    otp,
  });

  user.otp = await Hash({ plainText: otp });
  await user.save();

  return res.status(200).json({ message: "success" });
};

// ==================== reset password ====================
export const resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  const user = await userModel.findOne({ email, otp: { $exists: true } });
  if (!user) {
    throw new Error("user not exist", { cause: 404 });
  }

  if (!(await Compare({ plainText: otp, cipherText: user?.otp }))) {
    throw new Error("InValid otp", { cause: 400 });
  }

  // Hash password
  const hash = await Hash({ plainText: newPassword });

  await userModel.updateOne(
    { email },
    {
      password: hash,
      $unset: { otp: "" },
    },
  );

  return res.status(200).json({ message: "success" });
};

// ==================== update profile ====================
export const updateProfile = async (req, res, next) => {
  const { name, email, phone, gender, age } = req.body;

  if (name) req.user.name = name;
  if (gender) req.user.gender = gender;
  if (age) req.user.age = age;

  if (phone) {
    // Encrypt phone
    const encryptPhone = await Encrypt({
      plainText: phone,
      SECRET_KEY: process.env.SECRET_KEY,
    });
    req.user.phone = encryptPhone;
  }

  if (email) {
    // Check email
    const user = await userModel.findOne({ email });
    if (user) {
      throw new Error("email already exist", { cause: 409 });
    }

    // send email confirmation
    eventEmitter.emit("sendEmail", { email });

    // Update email
    req.user.email = email;
    req.user.confirmed = false;
  }

  await req.user.save();

  return res.status(200).json({ message: "success", user: req.user });
};

// ==================== freeze profile ====================
export const freezeProfile = async (req, res, next) => {
  const { id } = req.params;

  if (id && req.user.role !== userRoles.admin) {
    throw new Error("you can not freeze this account");
  }

  const user = await userModel.updateOne(
    {
      _id: id || req.user._id,
      isDeleted: { $exists: false },
    },
    {
      isDeleted: true,
      deletedBy: req.user._id,
    },
    {
      $inc: { __v: 1 },
    },
  );

  user.matchedCount
    ? res.status(200).json({ message: "success" })
    : res.status(400).json({ message: "fail to freeze profile" });
};

// ==================== unfreeze profile ====================
export const unfreezeProfile = async (req, res, next) => {
  const { id } = req.params;

  if (id && req.user.role !== userRoles.admin) {
    throw new Error("you can not unfreeze this account");
  }
  const user = await userModel.updateOne(
    {
      _id: id || req.user._id,
      isDeleted: { $exists: true },
    },
    {
      $unset: { isDeleted: "", deletedBy: "" },
    },
    {
      $inc: { __v: 1 },
    },
  );

  user.matchedCount
    ? res.status(200).json({ message: "success" })
    : res.status(400).json({ message: "user not exist or already restored" });
};

// ==================== update profileImage ====================
export const updateProfileImage = async (req, res, next) => {
  // const arrPaths = [];
  // for (const file of req?.files) {
    // [{}, {}]
  //   const { secure_url, public_id } = await cloudinary.uploader.upload(
  //     file?.path,
  //     {
  //       folder: "sarahaApp/users/coverImages",
  //     },
  //   );
  //   arrPaths.push({ secure_url, public_id });
  // }

  // const user = await userModel.findByIdAndUpdate(
  //   { _id: req?.user?._id },
  //   { coverImages: arrPaths },
  // );

  // Delete old image/images from cloudinary
  // option 1: delete old image/images one by one
  // for (const image of user?.coverImages) {
  //   await cloudinary.uploader.destroy(image?.public_id);
  // }

  // option 2: delete old image/images with one request
  // const publicIds = user?.coverImages?.map((image) => image?.public_id);
  // await cloudinary.api.delete_resources(publicIds);

  // delete folder from cloudinary
  await cloudinary.api.delete_resources_by_prefix(`sarahaApp/users/coverImages`);
  await cloudinary.api.delete_folder(`sarahaApp/users/coverImages`);

  return res.status(200).json({ message: "success" });
};

// ==================== delete user ====================
export const deleteUser = async (req, res, next) => {
  const { id } = req.params;

  if (id && req?.user?.role !== userRoles.admin) {
    throw new Error("you can not delete this account");
  }
  const user = await userModel.findByIdAndDelete({
    _id: id || req?.user?._id,
  });

  // res.status(200).json({ message: "success", user });

  user.deletedCount
    ? res.status(200).json({ message: "success" })
    : res.status(400).json({ message: "fail to delete account" });
};
