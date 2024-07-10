import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { stripeApp } from "../../helper/stripe";
import {
  // ChangePaymentStatus,
  makeAddonPaymentSuccessfull,
  makeSubscriptionPaymentSuccessfull,
  renewSubscription,
} from "../services/payment.services";
const stripeWebhookRoute = express.Router();
const endpointSecret = process.env.STRIPE_ENDPOINTSCRET || "";
stripeWebhookRoute.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const sig = request.headers["stripe-signature"] as string;
    let event;
    try {
      event = stripeApp.webhooks.constructEvent(
        request.body,
        sig,
        endpointSecret
      );
    } catch (err: any) {
      console.log("err in sendign webk`hook", err);
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event?.type) {
      case "payment_intent.succeeded":
        const paymentIntentadd = event.data.object;
        await makeAddonPaymentSuccessfull(paymentIntentadd.metadata);
      case "invoice.payment_succeeded":
        // On renewal of subscription billing_reason: 'subscription_cycle' will be recieved
        // on new creation of subscrption billing_reason: 'subscription_create', will be recieved
        //  When Payment successed from strips end and invoice is generated
        const paymentIntent: any = event.data.object;
        if (
          paymentIntent?.payment_intent &&
          paymentIntent?.customer &&
          paymentIntent?.lines?.data[0]?.period &&
          paymentIntent.billing_reason == "subscription_create"
        ) {
          await makeSubscriptionPaymentSuccessfull(
            paymentIntent.subscription_details.metadata,
            paymentIntent.billing_reason,
            paymentIntent?.lines?.data[0]?.period
          );
        } else if (
          paymentIntent.billing_reason == "subscription_cycle" &&
          paymentIntent?.customer &&
          paymentIntent?.lines?.data[0]?.plan?.product
        ) {
          await renewSubscription(
            paymentIntent.customer,
            paymentIntent.lines.data[0].plan.product
          );
        }
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
      // const subscriptionupdated = event.data.object;
      case "payment_method.attached":
        // const paymentMethod = event.data.object;
        break;
      case "customer.subscription.deleted":
        // Occurs whenever a customer's subscription ends.
        break;
      case "customer.subscription.paused":
        // Occurs whenever a customer's subscription ends.
        let data = event.data.object;
        break;
      // ... handle other event types
      default:
    }

    // Return a response to acknowledge receipt of the event
    return response.json({ received: true });
  }
);

export default stripeWebhookRoute;

// to listen stripe weebhook on local machine  ./stripe listen --forward-to localhost:3000/subscription/webhook
