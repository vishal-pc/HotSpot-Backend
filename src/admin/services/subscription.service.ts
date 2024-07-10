import dotenv from "dotenv";
import SubscriptionModel from "../models/subscription.models";
import {
  subscriptionPlanInterface,
  updateFreePlanInterface,
  updateSubscriptionPlanInterface,
} from "../types/subscriptions.interface";
import { FilterQuery } from "mongoose";
import AddOnPurchaseModel from "../models/addon.model";
import FreePlan from "../../user/models/freePlans.model";

dotenv.config();

export const CreateSubscriptionPlanService = async (
  data: subscriptionPlanInterface
) => {
  return SubscriptionModel.create(data);
};
export const getSubscriptionPlanByName = async (name: string) => {
  return SubscriptionModel.findOne({ name });
};
export const updateSubscriptionPlanById = async (
  _id: string,
  data: updateSubscriptionPlanInterface
) => {
  return SubscriptionModel.updateOne({ _id: _id }, data);
};

export const updateAddOnPlanById = async (
  _id: string,
  data: updateSubscriptionPlanInterface
) => {
  return AddOnPurchaseModel.updateOne({ _id: _id }, data);
};

export const updateFreePlanById = async (
  _id: string,
  data: updateFreePlanInterface
) => { 
  return FreePlan.updateOne({ _id: _id }, data);
};

export const getSubscriptionPlanById = async (_id: string) => {
  return SubscriptionModel.findOne({ _id: _id });
};

export const getAddOnPlanById = async (_id: string) => {
  return AddOnPurchaseModel.findOne({ _id: _id });
};

export const getFreePlanById = async (_id: string) => {
  return FreePlan.findOne({ _id: _id });
};

export const getAllSubscriptionPlans = async (filter: {
  search?: string;
  status?: string;
}) => {
  const filterQuery: FilterQuery<subscriptionPlanInterface> = {};
  if (filter?.search) {
    // filterQuery.name = `%${filter?.search}%`;
    filterQuery.name = new RegExp(filter.search, "i");
  }
  if (filter?.status) {
    filterQuery.isActive = filter.status === "active";
  }
  return SubscriptionModel.find(filterQuery);
};

export const getAllAddOnPlans = async (filter: {
  search?: string;
  status?: string;
}) => {
  const filterQuery: FilterQuery<subscriptionPlanInterface> = {};
  if (filter?.search) {
    // filterQuery.name = `%${filter?.search}%`;
    filterQuery.name = new RegExp(filter.search, "i");
  }
  if (filter?.status) {
    filterQuery.isActive = filter.status === "active";
  }
  return AddOnPurchaseModel.find(filterQuery);
};

export const getAllFreePlans = async (filter: {
  search?: string;
  status?: string;
}) => {
  const filterQuery: FilterQuery<subscriptionPlanInterface> = {};
  if (filter?.search) {
    // filterQuery.name = `%${filter?.search}%`;
    filterQuery.name = new RegExp(filter.search, "i");
  }
  if (filter?.status) {
    filterQuery.isActive = filter.status === "active";
  }
  return FreePlan.find(filterQuery);
};

export const deleteSubscriptionPlanById = async (_id: string) => {
  return SubscriptionModel.deleteOne({ _id: _id });
};

export const deleteAddOnPlanById = async (_id: string) => {
  return AddOnPurchaseModel.deleteOne({ _id: _id });
};

export const deleteFreePlanById = async (_id: string) => {
  return FreePlan.deleteOne({ _id: _id });
};

const subscriptionServices = {
  CreateSubscriptionPlanService,
  getSubscriptionPlanByName,
  getAllSubscriptionPlans,
  getAllAddOnPlans,
  updateSubscriptionPlanById,
  getSubscriptionPlanById,
  getAddOnPlanById,
  getFreePlanById,
  deleteSubscriptionPlanById,
  deleteAddOnPlanById,
  updateAddOnPlanById,
  updateFreePlanById,
  getAllFreePlans,
  deleteFreePlanById
};

export default subscriptionServices;
