import mongoose from "mongoose";
const { Schema } = mongoose;

const SportSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
});

const Sports = mongoose.model("Sports", SportSchema);

export default Sports;
