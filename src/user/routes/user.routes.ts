import express from "express";
import * as userController from "../controller/user.controller";
import { auth } from "../../middleware/auth";
import { socialauth } from "../../middleware/socialauth";
import upload from "../../middleware/multer.config";
import * as UserValidations from "../models/user.validation";
import validatePayload from "../../utils/payloadValidater";
import { ensureActiveSubscriptionForAllUsers } from "../scheduler/freePlan";
const userRouter = express.Router();
userRouter.post(
  "/register",
  UserValidations.UserProfileComplete,
  [auth],
  userController.registerOne
);

userRouter.post("/get_mobile_otp", userController.MobileNumberOTP);
userRouter.post("/logout", [auth], userController.logout);
userRouter.post("/upload_images", upload.single("avatar"));
userRouter.post("/verify_mobile_otp", userController.VerifyMobileNumberOtp);
userRouter.post(
  "/verify_social_auth",
  [socialauth],
  userController.VerifySocialAuth
);

userRouter.post(
  "/update_user_profile",
  UserValidations.UpdateProfileValidation,
  [auth],
  userController.UpdateUserProfile
);

userRouter.post("/get_signup_data", userController.GetallSignUpData);
userRouter.post(
  "/register_swipe",
  UserValidations.Swiper,
  [auth],
  userController.SwipeUser
);
userRouter.post("/get_my_swipes", [auth], userController.GetMySwipesUser);
userRouter.post("/get_user_profile", [auth], userController.GetUserProfile);
userRouter.post("/get_user_by_id", [auth], userController.GetUserProfileById);
userRouter.post("/get_who_liked_me", [auth], userController.GetUserWhoLikedMe);
userRouter.post(
  "/get_searched_users",
  UserValidations.Search,
  [auth],
  userController.getSearchedUsers
);
userRouter.post("/delete_my_profile", [auth], userController.deleteUserProfile);
userRouter.post("/block_report_user", [auth], userController.blockReportUser);
userRouter.post(
  "/unblock_user",
  validatePayload(UserValidations.UnblockUser),
  [auth],
  userController.UnblockUser
);
userRouter.post("/chats", [auth], userController.MakeChat);
userRouter.post("/view_user_story", [auth], userController.ViewUserStory);
userRouter.post(
  "/delete_user_story",
  UserValidations.DeleteStory,
  [auth],
  userController.DeleteUserStory
);
userRouter.post("/upload_text_story", [auth], userController.UploadTextStory);
userRouter.post("/comment_on_story", [auth], userController.CommentOnStory);
userRouter.post("/getnearbyuser", [auth], userController.getnearbyuser);
userRouter.post("/set_user_status", [auth], userController.SetUserStatus);
userRouter.post(
  "/save_user_fcm",
  UserValidations.UserFCM,
  [auth],
  userController.SaveUserFcm
);
userRouter.post(
  "/get_all_subscription",
  [auth],
  userController.GellAllSubscription
);

userRouter.post(
  "/check_user_subscription",
  UserValidations.ValidatePlan,
  [auth],
  userController.checkUserSubsciption
);
userRouter.post(
  "/get_comple_my_profile_data",
  userController.getcompleteProfileData
);

userRouter.post(
  "/complete_user_profile",
  [auth],
  userController.CompleteUserProfile
);

userRouter.post("/get_my_matches", [auth], userController.GetMyMatches);
userRouter.post("/delete_user_chats", [auth], userController.DeleteChats);
userRouter.post(
  "/send_notification_to_user",
  [auth],
  userController.SendNotification
);

userRouter.post(
  "/update_user_settings",
  [auth],
  userController.UpdateUserSettings
);

userRouter.post("/blocked_user", [auth], userController.blockedUser);

userRouter.post(
  "/check_other_user_plan",
  [auth],
  userController.getOtherUserPlanDetails
);

userRouter.post(
  "/call_log",
  validatePayload(UserValidations.CallLog),
  [auth],
  userController.registerCallLog
);

userRouter.post("/call_history", [auth], userController.GetUserCallLogs);
userRouter.post("/deduct_call", userController.deductUserCall);
userRouter.post("/cancel_subscription", userController.cancleSubscription);
userRouter.post("/reset_free_plans", ensureActiveSubscriptionForAllUsers);
userRouter.post("/check_blocked_status", userController.checkBlockedStatus);
userRouter.post(
  "/validate_purchase",
  [auth],
  userController.validateapplePurchase
);

export default userRouter;
