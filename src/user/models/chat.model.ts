import mongoose, { Document } from "mongoose";

const { Schema } = mongoose;
const chatSchema = new Schema({
  participants: [mongoose.Types.ObjectId],
  requestStatus: { type: String, default: "pending" },
  initiator: { type: mongoose.Types.ObjectId },
  responder: { type: mongoose.Types.ObjectId },
  isSuggestionActive: {
    type: Boolean,
    default: true,
  },
  IsChatDeleted: [
    {
      userId: mongoose.Types.ObjectId,
      deletedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
