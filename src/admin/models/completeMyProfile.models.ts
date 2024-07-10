import mongoose from "mongoose";
const { Schema } = mongoose;

const completeProfileSchema = new Schema({
  questions_name: {
    type: String,
    required: true,
  },
  input_type: {
    type: String,
    required: true,
  },
  question: {
    type: String,
    required: true,
  },
  options: {
    type: Array<String>,
    required: true,
  },
});
const CompleteProfile = mongoose.model(
  "CompleteProfile",
  completeProfileSchema
);
export default CompleteProfile;
