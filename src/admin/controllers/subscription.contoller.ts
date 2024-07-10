import { Request, Response } from "express";
import { getErrorMessage } from "../../utils/errors";
import subscriptionServices from "../services/subscription.service";
import { createPlanOnStripe } from "../../helper/stripe";
import {
  subscriptionPlanInterface,
  subscriptionPlanSchemaInterface,
} from "../types/subscriptions.interface";
import AddOnPurchaseModel from "../models/addon.model";
import FreePlan from "../../user/models/freePlans.model";

export interface IGetUserAuthInfoRequest extends Request {
  user: any;
}

export const createSubscriptionPlan = async (req: any, res: Response) => {
  try {
    const subscriptionPlaneInDb =
      await subscriptionServices.getSubscriptionPlanByName(req.body.name);
    if (subscriptionPlaneInDb) {
      return res
        .status(400)
        .json({ message: 'Subscription plan "name" already exist' });
    }
    const body: subscriptionPlanInterface = req.body;
    const stripePlane = await createPlanOnStripe({
      interval: body.billing_duration?.unit,
      interval_count: body.billing_duration?.duration,
      name: body.name,
      price: body.price,
      isAddOn: body.isAddOn,
    });
    const result = await subscriptionServices.CreateSubscriptionPlanService({
      ...body,
      price: (stripePlane.unit_amount || 0) / 100,
      stripe_price_id: stripePlane.id,
      stripe_product_id: stripePlane.product as string,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

export const createaddOnPlan = async (req: any, res: Response) => {
  try {
    const AddonePlaneInDb =
      await subscriptionServices.getSubscriptionPlanByName(req.body.name);
    if (AddonePlaneInDb) {
      return res
        .status(400)
        .json({ message: 'Addon plan "name" already exist' });
    }
    const body: subscriptionPlanInterface = req.body;
    const stripePlane = await createPlanOnStripe({
      name: body.name,
      price: body.price,
      isAddOn: body.isAddOn,
    });
    const result = await AddOnPurchaseModel.create({
      name: body.name,
      stripe_price_id: stripePlane.id,
      stripe_product_id: stripePlane.product as string,
      description: body.description,
      isActive: true,
      price: (stripePlane.unit_amount || 0) / 100,
      benefits: body.benefits,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

export const GetListOfSubscriptionPlan = async (
  req: Request,
  res: Response
) => {
  try {
    const subscriptions = await subscriptionServices.getAllSubscriptionPlans(
      req.query
    );
    return res.status(200).json({ subscriptions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};
export const GetListOfAddonPlan = async (req: Request, res: Response) => {
  try {
    const subscriptions = await subscriptionServices.getAllAddOnPlans(
      req.query
    );
    return res.status(200).json({ subscriptions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};
export const GetListOfFreePlan = async (req: Request, res: Response) => {
  try {
    const subscriptions = await subscriptionServices.getAllFreePlans(req.query);
    return res.status(200).json({ subscriptions });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};
export const updateSubscriptionPlan = async (req: any, res: Response) => {
  try {
    const id = req.params.id;

    const data = req.body;
    const plan: subscriptionPlanSchemaInterface | null =
      await subscriptionServices.getSubscriptionPlanById(req.params.id);

    if (!plan?._id) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }
    const body: subscriptionPlanInterface = req.body;
    if (
      body.price !== plan.price ||
      body.billing_duration?.unit !== plan.billing_duration?.unit ||
      body.billing_duration?.duration !== plan.billing_duration?.duration
    ) {
      const stripePlane = await createPlanOnStripe({
        interval: body.billing_duration?.unit,
        interval_count: body.billing_duration?.duration,
        name: body.name,
        price: body.price,
      });

      data.price = (stripePlane.unit_amount || 0) / 100;
      data.stripe_price_id = stripePlane.id;
      data.stripe_product_id = stripePlane.product as string;
    }
    await subscriptionServices
      .updateSubscriptionPlanById(id, { ...data })
      .then(async () => {
        const result = await subscriptionServices.getSubscriptionPlanById(id);
        return res.status(200).json(result);
      });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

export const updateAddOnPlan = async (req: any, res: Response) => {
  try {
    const id = req.params.id;

    const data = req.body;
    const plan = await subscriptionServices.getAddOnPlanById(req.params.id);

    if (!plan?._id) {
      return res.status(404).json({ message: "Add on plan not found" });
    }
    const body = req.body;

    if (body.price !== plan.price) {
      const stripePlane = await createPlanOnStripe({
        name: body.name,
        price: body.price,
        isAddOn: body.isAddOn,
      });
      data.price = (stripePlane.unit_amount || 0) / 100;
      data.stripe_price_id = stripePlane.id;
      data.stripe_product_id = stripePlane.product as string;
    }
    await subscriptionServices
      .updateAddOnPlanById(id, { ...data })
      .then(async () => {
        const result = await subscriptionServices.getAddOnPlanById(id);
        return res.status(200).json(result);
      });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};
export const changeSubscriptionPlanStatus = async (req: any, res: Response) => {
  try {
    const id = req.body.id;
    const isActive = req.body.isActive;
    // 	const subscriptionPlaneInDb =
    //   await subscriptionServices.getSubscriptionPlanByName(req.body.name);
    // 	if (subscriptionPlaneInDb) {
    // 		return res
    // 			.status(400)
    // 			.json({ message: 'Subscription plan "name" already exist' });
    // 	}

    await subscriptionServices
      .updateSubscriptionPlanById(id, { isActive })
      .then(async () => {
        const result = await subscriptionServices.getSubscriptionPlanById(id);
        return res.status(200).json(result);
      });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

export const changeAddOnPlanStatus = async (req: any, res: Response) => {
  try {
    const id = req.body.id;
    const isActive = req.body.isActive;

    await subscriptionServices
      .updateAddOnPlanById(id, { isActive })
      .then(async () => {
        const result = await subscriptionServices.getAddOnPlanById(id);
        return res.status(200).json(result);
      });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

export const changeFreePlanStatus = async (req: any, res: Response) => {
  try {
    const id = req.body.id;
    const is_active: boolean = req.body.is_active;
    if (is_active) {
      await FreePlan.updateMany(
        {
          is_active: true,
        },
        {
          is_active: false,
        }
      );
    }
    await subscriptionServices
      .updateFreePlanById(id, { is_active })
      .then(async () => {
        const result = await subscriptionServices.getFreePlanById(id);
        return res.status(200).json(result);
      });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

export const deleteSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const plans = await subscriptionServices.getSubscriptionPlanById(
      req.params.id
    );
    if (!plans?._id) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }
    const result = await subscriptionServices.deleteSubscriptionPlanById(
      req.params.id
    );
    return res
      .status(200)
      .json({ message: "Subscription plan deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};
export const deleteAddOnPlan = async (req: Request, res: Response) => {
  try {
    const plans = await subscriptionServices.getAddOnPlanById(req.params.id);
    if (!plans?._id) {
      return res.status(404).json({ message: "Add on plan not found" });
    }
    const result = await subscriptionServices.deleteAddOnPlanById(
      req.params.id
    );
    return res
      .status(200)
      .json({ message: "Add on plan deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

export const deleteFreePlan = async (req: Request, res: Response) => {
  try {
    const plans = await subscriptionServices.getFreePlanById(req.params.id);
    if (!plans?._id) {
      return res.status(404).json({ message: "Add on plan not found" });
    }
    const result = await subscriptionServices.deleteFreePlanById(req.params.id);
    return res
      .status(200)
      .json({ message: "Add on plan deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

export const getSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const plans = await subscriptionServices.getSubscriptionPlanById(
      req.params.id
    );
    if (!plans?._id) {
      return res.status(404).json({ message: "Subscription plan not found" });
    }

    return res.status(200).json(plans);
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

export const getAddOnPlan = async (req: Request, res: Response) => {
  try {
    const plans = await subscriptionServices.getAddOnPlanById(req.params.id);
    if (!plans?._id) {
      return res.status(404).json({ message: "Add On plan not found" });
    }

    return res.status(200).json(plans);
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

export const getFreePlan = async (req: Request, res: Response) => {
  try {
    const plans = await subscriptionServices.getFreePlanById(req.params.id);
    if (!plans?._id) {
      return res.status(404).json({ message: "Add On plan not found" });
    }

    return res.status(200).json(plans);
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

export const createOrEditFreePlan = async (req: Request, res: Response) => {
  try {
    if (req?.body?.id) {
      const data = req.body.data;
      const is_active: boolean = data.is_active;
      if (is_active) {
        await FreePlan.updateMany(
          {
            is_active: true,
          },
          {
            is_active: false,
          }
        );
      }
      const UpdatFreeplan = await subscriptionServices.updateFreePlanById(
        req.body?.id,
        { ...data }
      );
      return res.status(200).json(UpdatFreeplan);
    } else {
      //Make existing plan inactive first
      await FreePlan.updateMany(
        {
          is_active: true,
        },
        {
          is_active: false,
        }
      );
      const freePlan = await FreePlan.create(req.body.data);
      return res.status(200).json(freePlan);
    }
  } catch (error) {
    return res.status(500).json({ message: getErrorMessage(error) });
  }
};

const subscriptionController = {
  createSubscriptionPlan,
  createaddOnPlan,
  GetListOfSubscriptionPlan,
  GetListOfAddonPlan,
  changeSubscriptionPlanStatus,
  deleteSubscriptionPlan,
  deleteAddOnPlan,
  getSubscriptionPlan,
  getAddOnPlan,
  updateSubscriptionPlan,
  updateAddOnPlan,
  changeAddOnPlanStatus,
  createOrEditFreePlan,
  GetListOfFreePlan,
  changeFreePlanStatus,
  deleteFreePlan,
  getFreePlan,
};

export default subscriptionController;
