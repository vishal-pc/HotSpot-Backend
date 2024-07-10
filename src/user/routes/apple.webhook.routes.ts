import express from "express";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import axios from "axios";
import jwkToPem from "jwk-to-pem";
import User from "../models/user.model";
import SubscriptionModel from "../../admin/models/subscription.models";
import UserSubscription from "../models/userSubscription.model";
import PaymentLogModel from "../models/paymentLogs.model";
import { calculateExpiryDate } from "../services/payment.services";
import UserFreePlan from "../models/userFreePlan.model";
// Read the public key from the PEM file
// const publicKeyPath = path.resolve("/user/application/apple_public.pem");
// const publicKey = fs.readFileSync(publicKeyPath, "utf8");
const appleWebhookRoute = express.Router();
const APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys";
let applePublicKeys: any;
// Endpoint to receive notifications
const fetchApplePublicKeys = async () => {
  try {
    const response = await axios.get(APPLE_JWKS_URL);

    applePublicKeys = response.data.keys.reduce((acc: any, key: any) => {
      acc[key.kid] = jwkToPem(key);
      return acc;
    }, {});
  } catch (err) {
    console.error("Error fetching Apple public keys:", err);
    throw new Error("Failed to fetch Apple public keys");
  }
};

const extractPublicKeyFromX5c = (x5c: any) => {
  const cert = x5c[0];
  const pemCert = `-----BEGIN CERTIFICATE-----\n${cert}\n-----END CERTIFICATE-----`;
  return pemCert;
};

// Verify the JWT token
const verifyToken = async (token: any) => {
  try {
    const decodedHeader: any = jwt.decode(token, { complete: true });
    const x5c = decodedHeader?.header?.x5c;
    if (!x5c || !x5c.length) {
      throw new Error("No x5c certificate found in the JWT header");
    }
    const publicKey = extractPublicKeyFromX5c(x5c);
    return jwt.verify(token, publicKey, { algorithms: ["ES256"] });
  } catch (err) {
    console.error("Token verification failed:", err);
    throw err;
  }
};

appleWebhookRoute.post("/", async (req: any, res: any) => {
  const token = req.body.signedPayload;
  try {
    // Verify the JWT token
    const decoded = await verifyToken(token);
    // Handle the notification
    handleNotification(decoded);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(400).send("Invalid Token");
  }
});

const decodeSignedTransactionInfo = async (signedTransactionInfo: any) => {
  const decodedHeader: any = jwt.decode(signedTransactionInfo, {
    complete: true,
  });
  const x5c = decodedHeader.header.x5c;

  if (!x5c || !x5c.length) {
    throw new Error("No x5c certificate found in the JWT header");
  }

  const publicKey = extractPublicKeyFromX5c(x5c);
  return jwt.verify(signedTransactionInfo, publicKey, {
    algorithms: ["ES256"],
  });
};

const handleNotification = async (payload: any) => {
  const notificationType = payload.notificationType;
  const transactionData: any = await decodeSignedTransactionInfo(
    payload.data.signedTransactionInfo
  );
  if (!notificationType) return console.log("No transaction reason");
  switch (notificationType) {
    case "SUBSCRIBED":
      const originalTransactionId = transactionData.originalTransactionId;
      const userDetails = await User.findOne({
        apple_latest_transaction_id: originalTransactionId,
      });
      if (userDetails) {
        const subscription_details = await SubscriptionModel.findById(
          transactionData.productId
        );
        if (!subscription_details) {
          return console.log("No such Subscription Plan exist anymore");
        }
        await UserSubscription.deleteMany({
          user_id: userDetails._id,
        });

        await UserFreePlan.deleteMany({
          user_id: userDetails,
        });

        const endDate = calculateExpiryDate(
          subscription_details.billing_duration.duration,
          subscription_details.billing_duration.unit
        );

        await UserSubscription.create({
          user_id: userDetails._id,
          plan_name: subscription_details?.name,
          description: subscription_details?.description,
          price: subscription_details?.price,
          billing_duration: subscription_details?.billing_duration,
          swipes: subscription_details?.swipes,
          connects: subscription_details?.connects,
          chat: subscription_details?.chat,
          video_audio_call: subscription_details?.video_audio_call,
          SubscriptionIsActive: true,
          original_plan_details: subscription_details,
          isapplePurchse: true,
          expires_at: endDate,
          payment_status: "paid",
          payment_done_at: new Date(),
          apple_original_transaction_id: originalTransactionId,
        });

        await PaymentLogModel.create({
          user_id: userDetails._id,
          transaction_type: "subscription-renew",
          plan_id: subscription_details._id.toString(),
          amount: subscription_details.price,
          details: {
            swipes: subscription_details?.swipes,
            connects: subscription_details?.connects,
            chat: subscription_details?.chat,
            video_audio_call: subscription_details?.video_audio_call,
          },
          payment_status: "completed",
          payment_completed_at: new Date(),
        });
        console.log("User Subscription renewed");
      } else {
        console.log("No user exist with originalTransactionId");
      }
      break;
    case "DID_RENEW":
      // Handle renewal
      break;
    case "DID_CHANGE_RENEWAL_STATUS":
      if (payload.subtype == "AUTO_RENEW_DISABLED") {
        try {
          let updatedUserPayment = await UserSubscription.findOneAndUpdate(
            {
              apple_original_transaction_id:
                transactionData.originalTransactionId,
              cancelled_on_stripe: false,
            },
            {
              cancelled_on_stripe: true,
            }
          );
          console.log(
            "updatedUserPayment----------->>>>>>>",
            updatedUserPayment
          );
        } catch (err) {
          console.log("DID_CHANGE_RENEWAL_STATUS", err);
        }
      }
      // Handle cancellation
      break;
    // Add other notification types as needed
    default:
      console.log("Unhandled notification type:", notificationType);
  }
};
export default appleWebhookRoute;
