import userModel from "../DB/models/user.model.js";
import jwt from "jsonwebtoken";

export const authentication = async (req, res, next) => {
  try {
    const { authorization } = req.headers;

    const [prefix, token] = authorization.split(" ") || [];
    if (!prefix || !token) {
      return res.status(404).json({ message: "token not exist" });
    }

    let signature = "";
    if (prefix == "bearer") {
      signature = "may__123";
    } else if (prefix == "admin") {
      signature = "may__123__admin";
    } else {
      return res.status(400).json({ message: "InValid prefix token" });
    }

    // Verify token
    const decoded = jwt.verify(token, signature);

    // Check user exist
    const user = await userModel.findOne({ email: decoded.email }); // .lean();
    // user = user.toObject();
    4;
    if (!user) {
      return res.status(404).json({ message: "user not exist" });
    }

    req.user = user;

    return next();
  } catch (error) {
    if (
      error.name == "JsonWebTokenError" ||
      error.name == "TokenExpiredError"
    ) {
      return res.status(400).json({ message: "InValid Token" });
    }
    return res.status(500).json({
      message: "Server Error",
      message: error.message,
      error,
      stack: error.stack,
    });
  }
};
