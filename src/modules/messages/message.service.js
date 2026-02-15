import messageModel from "../../DB/models/message.model.js";
import userModel from "../../DB/models/user.model.js";

// ==================== create message ====================
export const createMessage = async (req, res, next) => {
  const { userId, content } = req.body;

  if (
    !(await userModel.findOne({ _id: userId, isDeleted: { $exists: false } }))
  ) {
    throw new Error("user not exist or freezed");
  }

  const message = await messageModel.create({ userId, content });

  return res
    .status(201)
    .json({ message: "message sent successfully", message });
};

// ==================== list messages ====================
export const listMessages = async (req, res, next) => {
  const messages = await messageModel.find({userId: req?.user?._id}).populate([
    {path: "userId", select: "name"},
  ])

  return res.status(200).json({message: "success", messages });
}

// ==================== get one message ====================
export const getMessage = async (req, res, next) => {
  const { id } = req.params;

  const message = await messageModel.findOne({userId: req?.user?._id, _id: id})

  if(!message) {
    throw new Error("message not found");
  }

  return res.status(200).json({message: "success", message });
}