import express from "express";
import subscriptionController from "../controllers/subscription.contoller";
import validatePayload from "../../utils/payloadValidater";
import {
  changeFreePlanStatusBodySchema,
  changeSubscriptionPlanStatusBodySchema,
  createAddONPlanBodySchema,
  createFreePlanBodySchema,
  createSubscriptionPlanBodySchema,
} from "../validations/subscription.validate";
const subscriptionRouter = express.Router();

// For creating subscription plan
subscriptionRouter.post(
  "/",
  validatePayload(createSubscriptionPlanBodySchema),
  subscriptionController.createSubscriptionPlan
);

subscriptionRouter.post(
  "/addon",
  validatePayload(createAddONPlanBodySchema),
  subscriptionController.createaddOnPlan
);

subscriptionRouter.post(
  "/free-plan",
  validatePayload(createFreePlanBodySchema),
  subscriptionController.createOrEditFreePlan
);

// For list of subscription plans
subscriptionRouter.get("/", subscriptionController.GetListOfSubscriptionPlan);
subscriptionRouter.get("/addon-list", subscriptionController.GetListOfAddonPlan);
subscriptionRouter.get("/free-plan-list", subscriptionController.GetListOfFreePlan);

// For deleting of subscription plan
subscriptionRouter.delete(
  "/:id",
  subscriptionController.deleteSubscriptionPlan
);

subscriptionRouter.delete(
  "/addon/:id",
  subscriptionController.deleteAddOnPlan
);

subscriptionRouter.delete(
  "/free-plan/:id",
  subscriptionController.deleteFreePlan
);

// For getying of subscription plan
subscriptionRouter.get(
	'/:id',
	subscriptionController.getSubscriptionPlan
);

subscriptionRouter.get(
	'/addon/:id',
	subscriptionController.getAddOnPlan
);

subscriptionRouter.get(
	'/free-plan/:id',
	subscriptionController.getFreePlan
);

subscriptionRouter.put(
  "/status",
  validatePayload(changeSubscriptionPlanStatusBodySchema),
  subscriptionController.changeSubscriptionPlanStatus
);

subscriptionRouter.put(
  "/addon/status",
  validatePayload(changeSubscriptionPlanStatusBodySchema),
  subscriptionController.changeAddOnPlanStatus
);

subscriptionRouter.put(
  "/free-plan/status",
  validatePayload(changeFreePlanStatusBodySchema),
  subscriptionController.changeFreePlanStatus
);

subscriptionRouter.put(
	'/:id',
	validatePayload(createSubscriptionPlanBodySchema),	
	subscriptionController.updateSubscriptionPlan
);

subscriptionRouter.put(
	'/addon/:id',
	validatePayload(createAddONPlanBodySchema),	
	subscriptionController.updateAddOnPlan
);
export default subscriptionRouter;
