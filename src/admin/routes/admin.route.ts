import express from "express";
import * as adminController from "../controllers/admin.contoller";
import * as planController from "../controllers/planstats.controller";
import { auth, verifyadminToken } from "../../middleware/auth";
import * as AdminValidators from "../validations/admin.validate";
import subscriptionRouter from "./subscription.route";
import validatePayload from "../../utils/payloadValidater";
import { activeInactiveUser } from "../validations/admin.validate";
const adminRouter = express.Router();

adminRouter.use("/subscription", [auth], subscriptionRouter);
// For User login
adminRouter.post(
  "/login",
  AdminValidators.AdminLoginValidate,
  adminController.loginAdmin
);

adminRouter.post(
  "/forgot-password",
  AdminValidators.forgotPassValidate,
  adminController.forgotPassword
);

adminRouter.post(
  "/Create0011Radar0011Admin",
  AdminValidators.AdminCreateValidate,
  adminController.makeNewAdmin
);

// Add/update Interest for user signup
adminRouter.post(
  "/add_update_interests",
  [auth],
  adminController.AddUpdateInterests
);

adminRouter.post(
  "/add_update_genders",
  [auth],
  adminController.AddUpdateGenders
);

adminRouter.post(
  "/add_update_occupation",
  [auth],
  adminController.AddUpdateOccupation
);

adminRouter.post("/add_update_sports", [auth], adminController.AddUpdateSport);

adminRouter.post(
  "/add_update_complete_profile_questions",
  [auth],
  adminController.CompleteUserProfile
);

// Add/update Work options for user signup
adminRouter.post(
  "/add-occupation",
  AdminValidators.AdminCreateValidate,
  adminController.makeNewAdmin
);

adminRouter.get(
  "/users",
  [auth],
  [verifyadminToken],
  adminController.getAllUsers
);

adminRouter.post(
  "/reported-users",
  [auth],
  [verifyadminToken],
  adminController.getAllRepotedUsers
);

adminRouter.get(
  "/users/:id",
  [auth],
  [verifyadminToken],
  adminController.ViewUserDetails
);
adminRouter.get(
  "/users/subscriptions/:id",
  [auth],
  [verifyadminToken],
  adminController.getUserAllSubscriptions
);

adminRouter.post(
  "/question_data",
  [auth],
  [verifyadminToken],
  adminController.addNewQuestion
);

adminRouter.post(
  "/update-question-data",
  [auth],
  [verifyadminToken],
  adminController.UpdateSuggestionQuestion
);

adminRouter.get(
  "/question_data",
  [auth],
  [verifyadminToken],
  adminController.getAllSuggestionQuestion
);

adminRouter.post(
  "/add-new-question",
  [auth],
  [verifyadminToken],
  AdminValidators.CompleteProfileValidate,
  adminController.addNewQuestionCompleteMProfile
);

adminRouter.get(
  "/announcements",
  [auth],
  [verifyadminToken],
  adminController.getAllAnnouncements
);

adminRouter.get(
  "/get-stats",
  [auth],
  [verifyadminToken],
  adminController.getStats
);

adminRouter.get(
  "/subscribed-users",
  [auth],
  [verifyadminToken],
  adminController.getAllSubscribedUsers
);
adminRouter.post(
  "/update-complete-profile-questions",
  [auth],
  [verifyadminToken],
  adminController.UpdateSignUpQuestion
);

adminRouter.post(
  "/block-unblock-user",
  validatePayload(activeInactiveUser),
  [auth],
  [verifyadminToken],
  adminController.BlockUnblockUser
);

adminRouter.post(
  "/deactivated-users",
  [auth],
  [verifyadminToken],
  adminController.DeactivateUser
);

adminRouter.post(
  "/deleted-users",
  [auth],
  [verifyadminToken],
  adminController.DeletedUsers
);

adminRouter.post(
  "/payment-logs",
  [auth],
  [verifyadminToken],
  adminController.PaymentLogs
);

adminRouter.post(
  "/update-max-radius",
  [auth],
  [verifyadminToken],
  AdminValidators.MaximumRadiusValidate,
  adminController.UpdateMaximumRadius
);

adminRouter.post(
  "/delete-chat-suggestion",
  [auth],
  [verifyadminToken],
  adminController.deleteChatSuggestion
);

adminRouter.post(
  "/generate-reports",
  [auth],
  [verifyadminToken],
  adminController.generateReports
);

// Plans stats routes
adminRouter.get(
  "/get_plans_stats",
  [auth],
  [verifyadminToken],
  planController.getPlansStats
);

adminRouter.get(
  "/get_all_users_for_plan/:planId",
  [auth],
  [verifyadminToken],
  planController.getAllUserListForPlan
);

adminRouter.get(
  "/get_addon_plans_stats",
  [auth],
  [verifyadminToken],
  planController.getAddOnPlansStats
);

export default adminRouter;
