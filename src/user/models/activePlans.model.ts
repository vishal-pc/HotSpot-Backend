import mongoose, { Document, Schema } from "mongoose";

interface IUserPayments extends Document {
  user_id: mongoose.Types.ObjectId;
  swipes: {
    type: string;
    count: number;
  };
  connects: {
    type: string;
    count: number;
  };
  chat: {
    type: boolean;
  };
  video_audio_call: {
    isAvailable: boolean;
    duration: number;
  };
}

const UserActivePLanSchema = new Schema<IUserPayments>({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  swipes: {
    type: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
    },
  },
  connects: {
    type: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
    },
  },
  chat: {
    type: Boolean,
    required: true,
  },
  video_audio_call: {
    isAvailable: {
      type: Boolean,
      required: true,
    },
    duration: {
      type: Number,
    },
  },
});

const UserActivePlan = mongoose.model<IUserPayments>(
  "Useractiveplan",
  UserActivePLanSchema
);

export default UserActivePlan;
