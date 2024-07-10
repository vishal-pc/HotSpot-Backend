import mongoose from "mongoose";

const userQuestionProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" }, // Reference to the Chat schema
  currentQuestion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuestionBank",
  },
  questionInitiator: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // new field
});

export const UserQuestionProgress = mongoose.model(
  "UserQuestionProgress",
  userQuestionProgressSchema
);
