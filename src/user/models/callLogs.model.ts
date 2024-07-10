// block.model.ts

import mongoose, { Document, Schema } from "mongoose";

interface IcallLogs extends Document {
  conversation_id: mongoose.Types.ObjectId;
  initiator_id: mongoose.Types.ObjectId;
  responder_id: mongoose.Types.ObjectId;
  call_type: String;
  call_status: String;
  duration: Number;
  timestamp: Date;
}

const CallLogSchema = new Schema<IcallLogs>({
  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
  },
  initiator_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  responder_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },
  call_status: {
    type: String,
    default: "Missed",
    enum: ["Missed", "Declined", "Connected"],
  },
  call_type: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  duration: {
    type: Number,
  },
});

const CallLogs = mongoose.model<IcallLogs>("CallLogs", CallLogSchema);
export default CallLogs;
