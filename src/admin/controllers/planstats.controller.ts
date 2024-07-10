import { Request, Response } from "express";
import * as planStatservice from "../services/planstats.service";
import { getErrorMessage } from "../../utils/errors";
import { UserListQuery } from "../services/planstats.service";

export const getPlansStats = async (req: any, res: Response) => {
  try {
    const query = req.query;
    const planStats = await planStatservice.getPlanStatsService(query);
    return res.status(200).send(planStats);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const getAddOnPlansStats = async (req: any, res: Response) => {
  try {
    const query = req.query;
    const planStats = await planStatservice.getAddOnPlanStatsService(query);
    return res.status(200).send(planStats);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const getAllUserListForPlan = async (req: any, res: Response) => {
  try {
    const { planId } = req.params;
    const { search, limit, page } = req.query;

    const query: UserListQuery = {
      planId,
      search: search ? String(search) : undefined,
      limit: limit ? parseInt(String(limit)) : undefined,
      page: page ? parseInt(String(page)) : undefined,
    };

    const result = await planStatservice.getAllUsersForPlan(query);

    return res.status(200).json({
      data: result.data,
      totalUsers: result.totalUsers,
      totalPages: result.totalPages,
      currentPage: result.currentPage,
    });
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};
