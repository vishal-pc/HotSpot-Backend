import mongoose, { Document, Schema } from "mongoose";
const expires_at_time = 2 * 24 * 60 * 60 * 1000;
interface IUserPayments extends Document {
  user_id: mongoose.Types.ObjectId;
  plan_name: string;
  stripe_product_id: string;
  stripe_subscription_id: string;
  description: string;
  cancelled_on_stripe: boolean;
  price: number;
  billing_duration: {
    duration: number;
    unit: string;
  };
  swipes: {
    type: string;
    count: number;
  };
  connects: {
    type: string;
    count: number;
  };
  chat: boolean;
  video_audio_call: {
    isAvailable: boolean;
    duration: number;
  };
  payment_status: "paid" | "cancelled" | "incomplete" | "inprogress";
  start_date: Date;
  SubscriptionIsActive: boolean;
  plan_type: "subscription" | "addon";
  payment_type: string;
  end_date: Date;
  payment_intent_id: string;
  stripe_customer_id: string;
  timestamp: Date;
  payment_done_at: Date;
  expires_at: Date;
  original_plan_details: any;
  apple_transaction_id: string;
  apple_original_transaction_id: string;
  isapplePurchse: boolean;
}

const UserSubscriptionSchema = new Schema<IUserPayments>({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  plan_name: {
    type: String,
  },
  stripe_product_id: {
    type: String,
  },
  stripe_subscription_id: {
    type: String,
  },
  description: {
    type: String,
    required: true,
  },
  cancelled_on_stripe: {
    type: Boolean,
    default: false,
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
  start_date: {
    type: Date,
    required: false,
  },
  payment_status: {
    type: String,
    enum: ["paid", "cancelled", "incomplete", "inprogress"],
    default: "incomplete",
  },
  SubscriptionIsActive: {
    type: Boolean,
    default: false,
  },
  plan_type: {
    type: String,
    required: true,
    default: "subscription",
  },
  payment_type: {
    type: String,
    default: "Plan Bought",
  },
  end_date: {
    type: Date,
    required: false,
  },
  payment_intent_id: {
    type: String,
  },
  stripe_customer_id: {
    type: String,
  },
  apple_transaction_id: {
    type: String,
  },
  apple_original_transaction_id: {
    type: String,
  },
  isapplePurchse: {
    type: Boolean,
  },
  timestamp: {
    type: Date,
    default: new Date(),
  },
  payment_done_at: { type: Date },
  expires_at: {
    type: Date,
    expires: 0,
    default: () => Date.now() + expires_at_time,
  },
  original_plan_details: {
    type: Schema.Types.Mixed,
  },
});

const UserSubscription = mongoose.model<IUserPayments>(
  "UserSubscription",
  UserSubscriptionSchema
);

export default UserSubscription;
