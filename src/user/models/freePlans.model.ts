import mongoose from "mongoose";
const { Schema } = mongoose;
export interface IFreePlan extends Document {
  _id: mongoose.Types.ObjectId,
  name: string;
  is_active: boolean;
  swipes: number;
  connects: number;
  video_audio_call: number;
  chat:boolean;
  renewalTime: number; //Show have number of days for renewal;
  timestamp: Date
}
const FreePlanSchema = new Schema({
  name: { type: String, required: true },
  is_active: {
    type: Boolean,
    default:true
  },
  swipes: { type: Number, default: 0 },
  connects: { type: Number, default: 0 },
  video_audio_call: { type: Number, default: 0 },
  chat:{
    type:Boolean,
    default:true
  },
  renewalTime: { type: Number,
    default:7
   },
   timestamp: {
    type: Date,
    default: new Date()
   }
});

FreePlanSchema.index({ userId: 1 }); // Optimize lookup

const FreePlan = mongoose.model("FreePlan", FreePlanSchema);
export default FreePlan;