import { Router } from "express";
import * as US from "./user.service.js";
import * as UV from "./user.validation.js";
import { authentication } from "../../middleware/authentication.js";
import { validation } from "../../middleware/validation.js";
import { userRoles } from "../../DB/models/user.model.js";
import { authorization } from "../../middleware/authorization.js";
import { allowedExtensions, MulterHost } from "../../middleware/multer.js";
import messageRouter from "../messages/message.controller.js";

const userRouter = Router();

userRouter.use("/messages", messageRouter);

userRouter.post(
  "/signup",
  MulterHost({
    customPath: "users",
    customExtensions: allowedExtensions.image,
  }).array("attachments"),
  validation(UV.signUpSchema),
  US.signUp,
);
userRouter.get("/confirmEmail/:token", US.confirmEmail);
userRouter.post("/signin", validation(UV.signInSchema), US.signIn);
userRouter.post("/loginWithGmail", US.loginWithGmail);
userRouter.get("/profile", authentication, US.getProfile);
userRouter.get("/profile/:id", US.getProfileData);
userRouter.post("/logout", authentication, US.logout);
userRouter.patch(
  "/updatePassword",
  validation(UV.updatePasswordSchema),
  authentication,
  US.updatePassword,
);
userRouter.patch(
  "/updateProfile",
  validation(UV.updateProfileSchema),
  authentication,
  US.updateProfile,
);
userRouter.patch(
  "/updateProfileImage",
  authentication,
  MulterHost({
    customExtensions: allowedExtensions.image,
  }).array("attachments"),
  validation(UV.updateProfileImageSchema),
  US.updateProfileImage,
);
userRouter.patch(
  "/forgetPassword",
  validation(UV.forgetPasswordSchema),
  US.forgetPassword,
);
userRouter.patch(
  "/resetPassword",
  validation(UV.resetPasswordSchema),
  US.resetPassword,
);
userRouter.post("/refreshToken", US.refreshToken);

userRouter.delete(
  "/freezeProfile/{:id}",
  validation(UV.freezeProfileSchema),
  authentication,
  US.freezeProfile,
);

userRouter.delete(
  "/unfreezeProfile/{:id}",
  validation(UV.unfreezeProfileSchema),
  authentication,
  US.unfreezeProfile,
);

userRouter.delete(
  "/deleteUser/{:id}",
  validation(UV.deleteUserSchema),
  authentication,
  US.deleteUser,
);

export default userRouter;
