import mongoose from "mongoose";

const { Schema } = mongoose;

// Define the schema for payment logs
const PaymentLogSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User", // Assuming you have a User model
  },
  transaction_type: {
    type: String,
    required: true,
    enum: ["subscription", "addon", "subscription-renew"], // Identifies the transaction type
  },
  stripeTransactionId: {
    type: String,
  },
  plan_id: {
    type: Schema.Types.ObjectId,
  },
  amount: {
    type: Number,
    required: true, // Transaction amount
  },
  currency: {
    type: String,
    default: "AUD",
    // Transaction currency
  },
  payment_status: {
    type: String,
    default: "incomplete",
  },
  details: {
    type: Schema.Types.Mixed, // Additional transaction details
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now, // Transaction timestamp
  },
});

// Create the model from the schema
const PaymentLogModel = mongoose.model("PaymentLog", PaymentLogSchema);

export default PaymentLogModel;
