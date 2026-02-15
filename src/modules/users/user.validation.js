import joi from "joi";
import { userGender } from "../../DB/models/user.model.js";
import { generalRules } from "../../utils/generalRules/index.js";

export const signUpSchema = {
  body: joi
    .object({
      name: joi.string().alphanum().min(2).required(),
      email: generalRules.email.required(),
      password: generalRules.password.required(),
      cPassword: joi.string().valid(joi.ref("password")).required(),
      phone: joi.string().required(),
      gender: joi.string().valid(userGender.male, userGender.female).required(),
      age: joi.number().min(18).max(60).required(),
    })
    .required(),

  // validation in case of Multer.single()
  // file: generalRules.file.required().messages({
  //   "any.required": "attachment is required",
  // }),

  // validation in case of Multer.array()
  files: joi.array().items(generalRules.file.required()).required().messages({
    "any.required": "attachments are required",
  }),

  // validation in case of Multer.fields()
  //   files: joi.object({
  //     attachment: joi.array().items(generalRules.file.required()).required(),
  //   attachments: joi.array().items(generalRules.file.required()).required(),
  // }).required(),
};

export const updateProfileImageSchema = {
  // validation in case of Multer.single()
  // file: generalRules.file.required()
  // validation in case of Multer.array()
  files: joi.array().items(generalRules.file.required()).required().messages({
    "any.required": "attachments are required",
  }),
};

export const signInSchema = {
  body: joi
    .object({
      email: generalRules.email.required(),
      password: generalRules.password.required(),
    })
    .required(),
};

export const updatePasswordSchema = {
  body: joi
    .object({
      oldPassword: generalRules.password.required(),
      newPassword: generalRules.password.required(),
      cPassword: joi.string().valid(joi.ref("newPassword")).required(),
    })
    .required(),
};

export const forgetPasswordSchema = {
  body: joi
    .object({
      email: generalRules.email.required(),
    })
    .required(),
};

export const resetPasswordSchema = {
  body: joi
    .object({
      email: generalRules.email.required(),
      otp: joi.string().length(6).required(),
      newPassword: generalRules.password.required(),
      cPassword: joi.string().valid(joi.ref("newPassword")).required(),
    })
    .required(),
};

export const updateProfileSchema = {
  body: joi
    .object({
      name: joi.string().alphanum().min(2),
      email: generalRules.email,
      phone: joi.string(),
      gender: joi.string().valid(userGender.male, userGender.female),
      age: joi.number().min(18).max(60),
    })
    .required(),
};

export const freezeProfileSchema = {
  params: joi.object({
    id: generalRules.id,
  }),
};

export const unfreezeProfileSchema = freezeProfileSchema;

export const deleteUserSchema = freezeProfileSchema;
