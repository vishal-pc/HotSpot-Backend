import mongoose from "mongoose";
import { boolean } from "yup";

const questionBankSchema = new mongoose.Schema({
  question: [String],
  answers: [String],
  nextQuestion: { type: mongoose.Schema.Types.ObjectId, ref: "QuestionBank" }, // You can update this by checking which question id is null
  fisrtQues: Boolean,
});

export const QuestionBank = mongoose.model("QuestionBank", questionBankSchema);
