import mongoose from "mongoose";
import userModel from "./models/user.model.js";

const checkConnectionDB = async () => {
  await mongoose
    .connect("mongodb://127.0.0.1:27017/sarahaApp")
    .then(() => {
      console.log("success to connect db...... 💙✌️");
    })
    .catch((error) => {
      console.log("fail to connect db...... 😡👀", error);
    });
};

export default checkConnectionDB;
