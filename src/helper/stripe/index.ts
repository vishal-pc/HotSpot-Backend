import stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

export const stripeApp = new stripe(process.env.STRIPE_API_KEY || "");

type planDataType = {
  price: number;
  name: string;
  interval?: "day" | "month" | "week" | "year";
  interval_count?: number;
  isAddOn?:boolean
};

export const createPlanOnStripe = async (data: planDataType) => {
  const priceData :any = {
    currency: "aud",
    unit_amount: Math.round(data.price * 100),
    product_data: {
      name: data.name,
    },
  };

  if (!data.isAddOn) {
    priceData['recurring'] = {
      interval: data.interval,
      interval_count: data.interval_count,
    };
  }

  return await stripeApp.prices.create(priceData);
 
}