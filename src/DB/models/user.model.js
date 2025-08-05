import mongoose from "mongoose";

export const userGender = {
  male: "male",
  female: "female",
};

export const userRoles = {
  user: "user",
  admin: "admin",
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minLength: 2,
      maxLength: 10,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    image: String,
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    gender: {
      type: String,
      enum: Object.values(userGender),
      default: userGender.male,
    },
    age: {
      type: Number,
      required: true,
      min: 18,
      max: 60,
    },
    confirmed: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: Object.values(userRoles),
      default: userRoles.user,
    },
  },
  {
    timestamps: true,
  }
);

const userModel = mongoose.models.User || mongoose.model("User", userSchema);

export default userModel;
