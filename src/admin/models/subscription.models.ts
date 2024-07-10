import mongoose from "mongoose";
import { subscriptionPlanSchemaInterface } from "../types/subscriptions.interface";
const { Schema } = mongoose;

const SubscriptionSchemas = new Schema<subscriptionPlanSchemaInterface>({
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
  billing_duration: {
    duration: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
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
  colors: [
    {
      type: String,
    },
  ],
  buttonTextColor: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const SubscriptionModel = mongoose.model(
  "Subscriptions_plan",
  SubscriptionSchemas
);

export default SubscriptionModel;
