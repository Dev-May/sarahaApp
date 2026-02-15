import userModel from "../DB/models/user.model.js";
import revokeTokenModel from "../DB/models/revoke-token.model.js";
import { verifyToken } from "../utils/token/verifyToken.js";

export const authentication = async (req, res, next) => {
  const { authorization } = req.headers;

  const [prefix, token] = authorization?.split(" ") || [];
  if (!prefix || !token) {
    throw new Error("Token not found", { cause: 400 });
  }

  let signature = "";
  if (prefix == process.env.BEARER_USER) {
    signature = process.env.ACCESS_TOKEN_USER;
  } else if (prefix == process.env.BEARER_ADMIN) {
    signature = process.env.ACCESS_TOKEN_ADMIN;
  } else {
    throw new Error("InValid prefix Token", { cause: 400 });
  }

  // Verify token
  const decoded = await verifyToken({ token, SIGNATURE: signature });
  if (!decoded?.email) {
    throw new Error("InValid token", { cause: 400 });
  }

  const revoked = await revokeTokenModel.findOne({ tokenId: decoded.jti });
  if (revoked) {
    throw new Error("please log in again", { cause: 400 });
  }

  // Check user exist
  const user = await userModel.findOne({ email: decoded.email }); // .lean();
  // user = user.toObject();
  4;
  if (!user) {
    throw new Error("user not exists", { cause: 404 });
  }
  if (!user.confirmed || user?.isDeleted == false) {
    throw new Error("please confirm your email first or you are freezed", { cause: 400 });
  }

  req.user = user;
  req.decoded = decoded;

  return next();
};
