import FreePlan from "../models/freePlans.model";
import User from "../models/user.model";
import UserFreePlan from "../models/userFreePlan.model";
import UserSubscription from "../models/userSubscription.model";

export async function ensureActiveSubscriptionForAllUsers() {
  try {
    const users = await User.find();
    const freePlanDetails = await FreePlan.findOne({ is_active: true });
    const deleteAllPrevious = await UserFreePlan.deleteMany();
    for (const user of users) {
      const activeSubscription = await UserSubscription.findOne({
        user_id: user._id,
        SubscriptionIsActive: true,
      });
      if (!activeSubscription) {
        const existingFreePlan = await UserFreePlan.findOne({
          user_id: user._id,
        });

        if (!existingFreePlan && user.is_user_active) {
          if (freePlanDetails) {
            const newFreePlan = new UserFreePlan({
              user_id: user._id,
              plan_name: freePlanDetails.name,
              swipes: freePlanDetails.swipes,
              connects: freePlanDetails.connects,
              chat: freePlanDetails.chat,
              video_audio_call: freePlanDetails.video_audio_call,
              freePlanId: freePlanDetails._id,
              renewalDate: new Date(
                new Date().getTime() +
                  freePlanDetails.renewalTime * 24 * 60 * 60 * 1000
              ), // setting the renewal date based on the default free plan's renewal time
            });
            await newFreePlan.save();
          } else {
            console.log("No active free plan configuration available.");
          }
        }
      }
    }
  } catch (error) {
    console.error(
      "Failed to ensure active subscriptions for all users:",
      error
    );
  }
}
