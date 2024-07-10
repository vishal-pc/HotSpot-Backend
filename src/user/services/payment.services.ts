import SubscriptionModel from "../../admin/models/subscription.models";
import { stripeApp } from "../../helper/stripe";
import UserSubscription from "../models/userSubscription.model";
import mongoose from "mongoose";
import User from "../models/user.model";
import AddOnPurchaseModel, { AddonIn } from "../../admin/models/addon.model";
import UserAddOnModel from "../models/userAddon.model";
import PaymentLogModel from "../models/paymentLogs.model";
import UserFreePlan from "../models/userFreePlan.model";
import UserFCM from "../models/userfcm.model";
import { addFcmJob } from "../../helper/Queues/pushQueue";
export const CreatePayment = async (data: any, userId: string) => {
  try {
    if (data.isaddon) {
      const addOndetails: AddonIn | null = await AddOnPurchaseModel.findById(
        data.id
      );
      if (addOndetails) {
        const userAddons = await UserAddOnModel.find({
          is_active: true,
          addon_type: addOndetails.benefits.name,
          user_id: new mongoose.Types.ObjectId(userId),
        });

        if (userAddons && userAddons.length > 0 && !data?.cancelPreviousPlan) {
          return {
            status: false,
            message:
              "Addon for " +
              addOndetails?.benefits?.name +
              " already exists. Cancle it first to buy new one",
          };
        }
        if (addOndetails) {
          const CreateUserAddon = await UserAddOnModel.create({
            user_id: userId,
            addon_id: addOndetails._id,
            addon_type: addOndetails.benefits.name,
            usage: addOndetails.benefits.value,
            original_addon_details: addOndetails,
          });
          const createNewLog: any = await genratePaymentLogs({
            user_id: userId,
            transaction_type: "addon",
            plan_id: addOndetails._id.toString(),
            amount: addOndetails.price,
            logType: "create",
            details: addOndetails.benefits,
          });
          let customerId = await GetuserCustometId(userId);
          const creatIntent: any = await createPaymentIntentForAddOn(
            customerId,
            addOndetails.stripe_price_id,
            CreateUserAddon._id,
            userId,
            addOndetails.stripe_product_id,
            createNewLog.log_id.toString()
          );

          return {
            status: true,
            customerId,
            subscriptionId: addOndetails._id,
            clientSecret: creatIntent?.client_secret
              ? creatIntent.client_secret
              : null,
          };
        }
      } else {
        return {
          status: false,
          message: "No such plan exist anymore. Please refresh the page",
        };
      }
    } else {
      const FindExistingPlan: any = await UserSubscription.find({
        user_id: new mongoose.Types.ObjectId(userId),
        SubscriptionIsActive: true,
        payment_status: "paid",
      });

      if (
        FindExistingPlan.length &&
        !FindExistingPlan[0]?.cancelled_on_stripe
      ) {
        return {
          status: false,
          message: "Please cancel current subscription to purchase new plan.",
        };
      }
      let customerId = await GetuserCustometId(userId);
      const subscription_details = await SubscriptionModel.findById(data.id);
      const priceId = subscription_details?.stripe_price_id;
      const saveUserPaymentToDB = new UserSubscription({
        user_id: userId,
        plan_name: subscription_details?.name,
        stripe_product_id: subscription_details?.stripe_product_id,
        description: subscription_details?.description,
        price: subscription_details?.price,
        billing_duration: subscription_details?.billing_duration,
        swipes: subscription_details?.swipes,
        connects: subscription_details?.connects,
        chat: subscription_details?.chat,
        video_audio_call: subscription_details?.video_audio_call,
        SubscriptionIsActive: false,
        stripe_customer_id: customerId,
        original_plan_details: subscription_details,
      });
      await saveUserPaymentToDB.save();
      const createNewLog: any = await genratePaymentLogs({
        user_id: userId,
        transaction_type: "subscription",
        plan_id: subscription_details?._id,
        amount: subscription_details?.price,
        logType: "create",
        details: {
          swipes: subscription_details?.swipes,
          connects: subscription_details?.connects,
          chat: subscription_details?.chat,
          video_audio_call: subscription_details?.video_audio_call,
        },
      });
      const subscription: any = await stripeApp.subscriptions.create({
        customer: customerId,
        items: [
          {
            price: priceId,
          },
        ],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
        metadata: {
          product: subscription_details?._id ? subscription_details?._id : "",
          type: "Subscription",
          priceId: priceId ? priceId : "",
          user_plan_id: saveUserPaymentToDB?._id
            ? saveUserPaymentToDB?._id.toString()
            : "",
          log_id: createNewLog?.log_id ? createNewLog?.log_id.toString() : "",
          user_id: userId,
        },
      });
      const updateSubs = await UserSubscription.findOneAndUpdate(
        {
          _id: saveUserPaymentToDB?._id,
        },
        {
          stripe_subscription_id: subscription.id,
        }
      );
      return {
        status: true,
        customerId,
        subscriptionId: subscription.id,
        clientSecret: subscription?.latest_invoice?.payment_intent
          ?.client_secret
          ? subscription.latest_invoice.payment_intent.client_secret
          : null,
      };
    }
  } catch (err) {
    console.error("CreatePayment Err---->", err);
    return {
      status: false,
      message: "Something went wrong please try later",
    };
  }
};

async function createPaymentIntentForAddOn(
  customerId: string,
  priceId: string,
  user_addon_id: any,
  user_id: string,
  product_id?: string,
  log_id?: any
) {
  const price = await stripeApp.prices.retrieve(priceId);
  if (price.unit_amount && price.currency) {
    const paymentIntent = await stripeApp.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      customer: customerId,
      metadata: {
        product: product_id ? product_id : "",
        type: "Addon",
        priceId: priceId,
        user_plan_id: user_addon_id ? user_addon_id.toString() : "",
        log_id: log_id ? log_id.toString() : "",
        user_id: user_id,
      },
    });
    return paymentIntent;
  } else {
    console.error("No such plan exists");
    return false;
  }
}

async function GetuserCustometId(user_id: any) {
  const user = await User.findById(user_id);
  let customerId = "";
  if (user?.stripe_customer_id) {
    customerId = user.stripe_customer_id;
    const checkidFromStripe = await stripeApp.customers.retrieve(customerId);
    if (checkidFromStripe?.deleted) {
      const customer = await stripeApp.customers.create({
        name: user?.first_name + " " + user?.last_name,
        email: user?.mobile + "@hotspot.com",
      });
      customerId = customer.id;
      user.stripe_customer_id = customer.id;
      user?.save();
    } else {
      customerId = user?.stripe_customer_id;
    }
  } else if (user) {
    const customer = await stripeApp.customers.create({
      name: user?.first_name + " " + user?.last_name,
      email: user?.mobile + "@hotspot.com",
    });
    customerId = customer.id;
    user.stripe_customer_id = customer.id;
    user?.save();
  }

  return customerId;
}

export const genratePaymentLogs = async (data: {
  user_id?: any;
  transaction_type?: string;
  plan_id?: string;
  amount?: Number;
  details?: any;
  logType: "create" | "update";
  log_id?: string;
  update_data?: any;
  payment_status?: "incomplete" | "completed" | "cancelled";
}) => {
  try {
    if (data?.logType == "create") {
      const createLog = await PaymentLogModel.create({
        user_id: data?.user_id,
        transaction_type: data?.transaction_type,
        plan_id: data?.plan_id,
        amount: data?.amount,
        details: data?.details,
        payment_status: data?.payment_status,
      });

      return {
        log_id: createLog._id,
        status: true,
        message: "Log created",
      };
    } else if (data?.logType == "update" && data?.log_id) {
      const logId = new mongoose.Types.ObjectId(data?.log_id);
      const updateLog = await PaymentLogModel.findOneAndUpdate(
        {
          _id: logId,
        },
        data?.update_data
      );

      return {
        status: true,
        message: "Log updated",
      };
    } else {
      return {
        status: false,
        message: "Log cannot be genrated",
      };
    }
  } catch (err) {
    console.error("genratePaymentLogs errrr", err);
  }
};

export const makeAddonPaymentSuccessfull = async (metadata: any) => {
  try {
    if (metadata?.user_plan_id && metadata?.type == "Addon") {
      const addon_id = new mongoose.Types.ObjectId(metadata.user_plan_id);
      const planToBeActivatedDetails: any = await UserAddOnModel.findOne({
        _id: addon_id,
      });
      if (
        planToBeActivatedDetails?.addon_type &&
        planToBeActivatedDetails?.user_id
      ) {
        const removeExistingAddOns = await UserAddOnModel.deleteMany({
          user_id: planToBeActivatedDetails?.user_id,
          addon_type: planToBeActivatedDetails?.addon_type,
          _id: {
            $ne: addon_id,
          },
        });
      }

      const updateUseraddon = await UserAddOnModel.findOneAndUpdate(
        { _id: addon_id },
        {
          is_active: true,
          payment_done_at: new Date(),
          expires_at: Date.now() + 24 * 60 * 60 * 1000,
        }
      );
      if (metadata?.log_id) {
        await genratePaymentLogs({
          logType: "update",
          log_id: metadata?.log_id,
          update_data: {
            payment_status: "completed",
            payment_completed_at: new Date(),
          },
        });
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("makeAddonPaymentSuccessfull", error);
  }
};

export const makeSubscriptionPaymentSuccessfull = async (
  metadata: any,
  billing_reason: string,
  dates: any
) => {
  try {
    if (
      metadata?.user_plan_id &&
      metadata?.type == "Subscription" &&
      billing_reason == "subscription_create"
    ) {
      const plan_id = new mongoose.Types.ObjectId(metadata.user_plan_id);

      const planToBeActivatedDetails: any = await UserSubscription.findOne({
        _id: plan_id,
      });

      if (planToBeActivatedDetails?.user_id) {
        const removeExistingSubs = await UserSubscription.deleteMany({
          user_id: planToBeActivatedDetails?.user_id,
          _id: {
            $ne: plan_id,
          },
        });
      }
      let endDate = new Date(dates?.end * 1000);
      const updateduserPlan = await UserSubscription.findOneAndUpdate(
        { _id: plan_id },
        {
          payment_status: "paid",
          SubscriptionIsActive: true,
          payment_done_at: new Date(),
          expires_at: endDate,
        }
      );
      if (metadata?.user_id) {
        const userId = new mongoose.Types.ObjectId(metadata.user_id);
        await UserFreePlan.deleteMany({
          user_id: userId,
        });
      }
      if (metadata?.log_id) {
        await genratePaymentLogs({
          logType: "update",
          log_id: metadata?.log_id,
          update_data: {
            payment_status: "completed",
            payment_completed_at: new Date(),
          },
        });
      }
      return true;
    } else {
      console.log("values not found", metadata);
    }
    return false;
  } catch (error) {
    console.error("makeAddonPaymentSuccessfull", error);
  }
};

export const cancelUserSubscription = async (body: any, user_id: string) => {
  try {
    const subscriptionId = body.subscription_id;
    const userId = user_id;

    const cancellation = await stripeApp.subscriptions.cancel(subscriptionId);

    if (cancellation.status == "canceled") {
      const cancelPlan = await UserSubscription.findOneAndUpdate(
        {
          stripe_subscription_id: subscriptionId,
        },
        {
          cancelled_on_stripe: true,
        }
      );
      return {
        status: true,
        message: "Product cancelled successfully",
      };
    }
  } catch (err) {
    console.error("err", err);
  }
};

export const renewSubscription = async (
  customer_id: string,
  product_id: string
) => {
  const product_details = await SubscriptionModel.findOne({
    stripe_product_id: product_id,
  });
  if (!product_details) {
    return false;
  }
  const user = await User.findOne({ stripe_customer_id: customer_id });
  if (!user) return;
  const userId = new mongoose.Types.ObjectId(user._id);
  await UserSubscription.deleteMany({
    user_id: userId,
  });
  await UserFreePlan.deleteMany({
    user_id: userId,
  });
  let customerId = customer_id;
  const saveUserPaymentToDB = new UserSubscription({
    user_id: userId,
    plan_name: product_details?.name,
    stripe_product_id: product_details?.stripe_product_id,
    description: product_details?.description,
    price: product_details?.price,
    billing_duration: product_details?.billing_duration,
    swipes: product_details?.swipes,
    connects: product_details?.connects,
    chat: product_details?.chat,
    video_audio_call: product_details?.video_audio_call,
    stripe_customer_id: customerId,
    original_plan_details: product_details,
    payment_status: "paid",
    SubscriptionIsActive: true,
    payment_done_at: new Date(),
  });
  await saveUserPaymentToDB.save();
  await genratePaymentLogs({
    user_id: user._id,
    transaction_type: "subscription-renew",
    plan_id: product_details?._id,
    amount: product_details?.price,
    logType: "create",
    details: {
      swipes: product_details?.swipes,
      connects: product_details?.connects,
      chat: product_details?.chat,
      video_audio_call: product_details?.video_audio_call,
    },
    payment_status: "completed",
  });
  const UserFcm: any = await UserFCM.findOne({
    user_id: new mongoose.Types.ObjectId(userId),
  });
  if (UserFcm?.fcm_token) {
    let notificationData = {
      title: "Subscription Renewed",
      body: "You subscription has be renewed",
      userFcmToken: UserFcm?.fcm_token,
      data: {},
    };
    await addFcmJob(notificationData).then(() => {});
    console.log("Notifications send");
  }
};

export const calculateExpiryDate = (duration: number, unit: string) => {
  const currentDate = new Date();
  switch (unit) {
    case "week":
      currentDate.setDate(currentDate.getDate() + duration * 7);
      break;
    case "month":
      currentDate.setMonth(currentDate.getMonth() + duration);
      break;
    case "year":
      currentDate.setFullYear(currentDate.getFullYear() + duration);
      break;
    default:
      throw new Error("Invalid unit for billing duration");
  }
  currentDate.setHours(currentDate.getHours() + 2); // Adding the extra 2 hours
  return currentDate;
};
