import mongoose from "mongoose";
import { string } from "yup";

const { Schema } = mongoose;

export interface IUseraddOn extends Document {
  user_id: mongoose.Types.ObjectId;
  addon_id: mongoose.Types.ObjectId;
  payment_initialized_at: Date;
  addon_type: String;
  payment_done_at: Date;
  usage: number;
  is_active: Boolean;
  createdAt: Date;
  expires_at: Date;
  original_addon_details: any;
  apple_original_transaction_id: string;
}
const UserAddOnSchema = new Schema<IUseraddOn>({
  user_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  addon_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "AddOnPurchase",
  },
  addon_type: {
    type: String,
    required: true,
  },
  payment_initialized_at: {
    type: Date,
    default: Date.now,
  },
  payment_done_at: {
    type: Date,
  },
  usage: {
    type: Number,
    required: true,
    default: 0, // Useful if the add-on has limited usage, like credits
  },
  is_active: {
    type: Boolean,
    required: true,
    default: false, // Helps in toggling the add-on's active status
  },
  expires_at: {
    type: Date,
    expires: 0,
    default: () => Date.now() + 24 * 60 * 60 * 1000,
  },
  original_addon_details: {
    type: Schema.Types.Mixed,
  },
  apple_original_transaction_id: {
    type: String,
  },
});

// Creating the model from the schema
const UserAddOnModel = mongoose.model("UserAddOn", UserAddOnSchema);

export default UserAddOnModel;
