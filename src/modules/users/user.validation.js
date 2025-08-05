import joi from "joi";
import { userGender } from "../../DB/models/user.model.js";
import { generalRules } from "../../utils/generalRules.js";

export const signUpSchema = {
  body: joi
    .object({
      name: joi.string().alphanum().min(3).max(5).required(),
      email: generalRules.email.required(),
      password: generalRules.password.required(),
      cPassword: joi.string().valid(joi.ref("password")).required(),
      phone: joi.string().required(),
      gender: joi.string().valid(userGender.male, userGender.female).required(),
      age: joi.number().min(18).max(60).required(),
    })
    .required(),
  // headers: generalRules.headers.required(),
};
