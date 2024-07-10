import mongoose from "mongoose";
const { Schema } = mongoose;
export interface IFreePlan extends Document {
  user_id: mongoose.Types.ObjectId;
  plan_name: string;
  swipes: number;
  connects: number;
  chat: boolean;
  video_audio_call: number;
  freePlanId: mongoose.Types.ObjectId;
}
const UserFreePlanSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true, // Ensure one document per user
  },
  plan_name: { type: String },
  swipes: { type: Number, default: 0 },
  connects: { type: Number, default: 0 },
  chat: {
    type: Boolean,
    default: true,
  },
  video_audio_call: { type: Number, default: 0 },
  renewalDate: { type: Date, required: true },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  freePlanId: {
    type: Schema.Types.ObjectId,
    ref: "FreePlan",
  },
});

// UserFreePlan.index({ userId: 1 }); // Optimize lookup

const UserFreePlan = mongoose.model("userFreePlan", UserFreePlanSchema);
export default UserFreePlan;
