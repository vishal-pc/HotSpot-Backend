import { Timestamp } from "firebase-admin/firestore";
import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
  first_name: {
    type: String,
  },
  last_name: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  dob: {
    type: Date,
  },
  gender: {
    type: Number,
  },
  location_access: Boolean,
  meta: {
    roses: Number,
    matches: Number,
  },
  interest: {
    type: Array,
  },
  work: {
    type: String,
  },
  sports: {
    type: String,
  },
  mobile: String,
  bio: String,
  IsprofileComplete: {
    type: Boolean,
    default: false,
  },
  IsAdmin: {
    type: Boolean,
    default: false,
  },
  isOnline: {
    type: Boolean,
    default: true,
  },
  location: {
    type: {
      type: String,
      default: "Point",
    },
    coordinates: {
      type: [Number],
      index: "2dsphere",
      default: [0, 0],
    },
  },
  address: {
    type: String,
  },
  interested_in: {
    type: Number,
  },
  age_range: {
    type: Array<Number>,
  },
  distance_preference: {
    type: Number,
    default: 100,
  },
  is_user_active: {
    type: Boolean,
    default: true,
  },
  is_deactivated_by_admin: {
    type: Boolean,
    default: false,
  },
  stripe_customer_id: {
    type: String,
  },
  height: {
    type: String, // stored as '5ft 7in'
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ["KG", "LBS"],
    },
  },
  religion: {
    type: String,
  },
  starSign: {
    type: String,
  },
  drinkingSmokingFrequency: {
    type: String,
  },
  drink: {
    type: String,
  },
  eyeColor: {
    type: String,
  },
  preferredPet: {
    type: String,
  },
  relationshipType: {
    type: String,
  },
  traitsAttractedTo: {
    type: Array<String>,
  },
  enjoyableActivity: {
    type: Array<String>,
  },
  partnerQualities: {
    type: Array<String>,
  },
  timestamp: {
    type: Date,
  },
  signup_type: {
    social_name: {
      type: String,
      enum: ["Google", "Apple", "Facebook"],
    },
    social_data: {
      type: Schema.Types.Mixed,
    },
  },
  apple_latest_transaction_id: {
    type: String,
  },
});
userSchema.index({ location: "2dsphere" });
const User = mongoose.model("user", userSchema);

export default User;
