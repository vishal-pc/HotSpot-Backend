export type subscriptionPlanInterface = {
  name: string;
  description: string;
  price: number;
  isActive: boolean;
  stripe_price_id: string;
  stripe_product_id: string;
  billing_duration: {
    duration: number;
    unit: "day" | "month" | "week" | "year";
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
  colors: string[];
  buttonTextColor: string;
  isAddOn: boolean;
  benefits: {
    name: string;
    value: number;
  };
  timestamp: Date;
};

export type updateSubscriptionPlanInterface = {
  name?: string;
  description?: string;
  price?: number;
  isActive?: boolean;
  billing_duration?: {
    duration: number;
    unit: "day" | "month" | "week" | "year";
  };
  swipes?: {
    type: string;
    count: number;
  };
  connects?: {
    type: string;
    count: number;
  };
  chat?: boolean;
  video_audio_call?: {
    isAvailable: boolean;
    duration: number;
  };
  colors?: string[];
};

export type updateFreePlanInterface = {
  name?: string;
  is_active?: boolean;
  swipes?: number;
  connects?: number;
  video_audio_call?: number;
  renewalTime?: number;
};

export interface subscriptionPlanSchemaInterface
  extends subscriptionPlanInterface {
  _id: mongodb.ObjectId;
}

export interface questionBankSchema {
  _id: mongodb.ObjectId;
  question: string;
  answers: string[];
  nextQuestion: mongodb.ObjectId;
}
