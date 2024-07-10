import mongoose from "mongoose";
import dotenv from "dotenv";
import { string } from "yup";
dotenv.config();
const { Schema } = mongoose;
const expires_at_time = 7200000;
const storySchema = new Schema({
  user_id: {
    type: Schema.ObjectId,
    required: true,
  },
  mediaUrl: {
    type: String,
  },
  type: {
    type: String,
    required: true,
  },
  caption: {
    type: String,
  },
  text_story_properties: {
    background: {
      type: String,
    },
    text: {
      type: String,
    },
    font_style: {
      fontWeight: {
        type: String,
      },
      fontStyle: {
        type: String,
      },
    },
  },
  views: [
    {
      user_id: {
        type: Schema.ObjectId,
      },
      viewed_at: {
        type: Date,
        default: Date.now,
        required: false,
      },
    },
  ],
  expires_at: {
    type: Date,
    expires: 0,
    default: () => Date.now() + expires_at_time,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Story = mongoose.model("story", storySchema);

export default Story;
