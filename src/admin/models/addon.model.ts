import mongoose from "mongoose";

const { Schema } = mongoose;

export interface AddonIn extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  stripe_price_id: string;
  stripe_product_id: string;
  description: string;
  isActive: Boolean;
  price: Number;
  benefits: {
    name: String;
    value: Number;
  };
  createdAt: Date;
}
const AddOnPurchaseSchema = new Schema<AddonIn>({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  stripe_price_id: {
    type: String,
    required: true,
  },
  stripe_product_id: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    required: true,
    default: true,
  },
  price: {
    type: Number,
    required: true,
  },
  benefits: {
    name: {
      type: String,
      required: true,
      enum: ["connects", "swipes", "video_audio_call"],
    },
    value: {
      type: Number,
      required: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const AddOnPurchaseModel = mongoose.model("AddOnPurchase", AddOnPurchaseSchema);
export default AddOnPurchaseModel;
