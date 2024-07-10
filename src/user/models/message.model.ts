import mongoose, { Document, Schema } from "mongoose";
import { string } from "yup";

export interface IMessage extends Document {
  sender: string;
  receiver_id: string;
  message: string;
  message_state: "sent" | "delivered" | "seen";
  timestamp: Date;
  message_type: string;
  mediaUrl: string;
  isReply: boolean;
  toWhichReplied: any;
  conversationId: mongoose.Types.ObjectId;
  reaction: any;
  message_id: string;
}

const messageSchema: Schema<IMessage> = new mongoose.Schema({
  sender: mongoose.Types.ObjectId,
  receiver_id: mongoose.Types.ObjectId,
  message: String,
  message_state: {
    type: String,
    default: "sent",
  },
  isReply: {
    type: Boolean,
    default: false,
  },
  message_id: {
    type: String, //This id is to show single tick on frontend as the users does not get any id when a message is send from his side
  },
  toWhichReplied: {
    message_type: {
      type: String,
    },
    message: {
      type: String,
    },
    messageOwner: mongoose.Types.ObjectId,
  },
  reaction: [
    {
      user_id: mongoose.Types.ObjectId,
      reaction: String,
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
  message_type: String,
  mediaUrl: String,
  conversationId: mongoose.Types.ObjectId,
});

const Message = mongoose.model<IMessage>("Message", messageSchema);

export default Message;
