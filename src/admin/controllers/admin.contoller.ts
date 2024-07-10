import { Request, Response } from "express";
import * as adminServices from "../services/admin.service";
import { getErrorMessage } from "../../utils/errors";
import User from "../../user/models/user.model";
import {
  GetUserAllSubscription,
  GetUserProfileAllDetails,
  SendPushToUser,
} from "../../user/services/user.service";
import Bull from "bull";
import dotenv from "dotenv";
dotenv.config();
import { error } from "console";
import CompleteProfile from "../models/completeMyProfile.models";
import mongoose from "mongoose";
import { QuestionBank } from "../models/questionBank.model";
import PaymentLogModel from "../../user/models/paymentLogs.model";
import Settings from "../models/admin.settings.model";
import redisClient from "../../helper/radis";

const escapeRegex = (string: string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
};
export interface IGetUserAuthInfoRequest extends Request {
  user: any;
}

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const getUser = await User.findOne({
      email: req.body.email,
      IsAdmin: true,
    });
    if (!getUser) {
      return res.status(404).json({
        message: "Admin does not exists with this email!",
        status: false,
      });
    }
    const foundUser = await adminServices.loginAdmin(req.body, getUser);

    if (!foundUser?.status) {
      return res.status(401).json({
        message: "Please enter valid credentionals!",
        status: false,
      });
    }
    return res.status(200).send(foundUser);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const foundUser = await adminServices.forgotPassword(req.body);
    return res.status(200).send(foundUser);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const makeNewAdmin = async (req: Request, res: Response) => {
  try {
    const UserCreated = await adminServices.makeNewAdmin(req.body);
    return res.status(200).send(UserCreated);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const AddUpdateInterests = async (req: any, res: Response) => {
  try {
    const UserCreated = await adminServices.AddUpdateInterests(
      req.body.data,
      req?.user
    );
    return res.status(200).send(UserCreated);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const AddUpdateGenders = async (req: any, res: Response) => {
  try {
    const UserCreated = await adminServices.AddUpdateGenders(
      req.body.data,
      req?.user
    );
    return res.status(200).send(UserCreated);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const AddUpdateOccupation = async (req: any, res: Response) => {
  try {
    const UserCreated = await adminServices.AddUpdateOccupation(
      req.body.data,
      req?.user
    );
    return res.status(200).send(UserCreated);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const AddUpdateSport = async (req: any, res: Response) => {
  try {
    const UserCreated = await adminServices.AddUpdateSports(
      req.body.data,
      req?.user
    );
    return res.status(200).send(UserCreated);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const CompleteUserProfile = async (req: any, res: Response) => {
  try {
    const result = await adminServices.CompleteUserProfile(
      req.body.data,
      req?.user
    );
    return res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};
export const getAllUsers = async (req: any, res: Response) => {
  try {
    const UserCreated = await adminServices.getAllUsers(req.query);
    return res.status(200).send(UserCreated);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const getAllSubscribedUsers = async (req: any, res: Response) => {
  try {
    const subscribed = await adminServices.getAllSubscribedUsers(req.query);
    return res.status(200).send(subscribed);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const getAllRepotedUsers = async (req: any, res: Response) => {
  try {
    const UserCreated = await adminServices.getAllRepotedUsers(
      req.body,
      req?.user
    );
    return res.status(200).send(UserCreated);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const ViewUserDetails = async (req: Request, res: Response) => {
  try {
    const UserCreated: any = await GetUserProfileAllDetails(req.params.id);
    if (!UserCreated.getUserDetails) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }
    return res.status(200).send(UserCreated?.getUserDetails[0]);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const getUserAllSubscriptions = async (req: Request, res: Response) => {
  try {
    const page = req?.query?.page ? +req?.query?.page : 1;
    const size = req?.query?.size ? +req?.query?.size : 10;
    const subscriptions: any = await GetUserAllSubscription(
      req.params.id,
      page,
      size,
      req?.query?.search as string
    );

    return res.status(200).send(subscriptions);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const addNewQuestion = async (req: Request, res: Response) => {
  try {
    const subscriptions: any = await adminServices.addNewQuestion(req?.body);
    return res.status(200).send(subscriptions);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const UpdateSuggestionQuestion = async (req: any, res: Response) => {
  try {
    const updateQuestion = await QuestionBank.findOneAndUpdate(
      { _id: req.body.id },
      req.body.data
    );
    return res.status(200).send({
      status: true,
      message: updateQuestion,
    });
  } catch (err) {
    console.error("UpdateSuggestionQuestion", err);
    return res.status(500).send(getErrorMessage(err));
  }
};

export const getAllSuggestionQuestion = async (req: Request, res: Response) => {
  try {
    const subscriptions: any = await QuestionBank.find();

    return res.status(200).send({
      data: subscriptions,
      status: true,
    });
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const addNewQuestionCompleteMProfile = async (
  req: Request,
  res: Response
) => {
  try {
    const newQuestion = new CompleteProfile(req.body);
    await newQuestion.save();
    return res.status(200).send({
      status: true,
      message: "New question added.",
    });
  } catch (err) {
    console.error("addNewQuestion", err);
    return {
      status: false,
      message: "Error while getting data",
    };
  }
};

export const getAllAnnouncements = async (req: any, res: Response) => {
  try {
    const UserCreated = await adminServices.getAllAnnouncements(req.query);
    return res.status(200).send(UserCreated);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const getStats = async (req: any, res: Response) => {
  try {
    const stats = await adminServices.getStatsService();
    return res.status(200).send(stats);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const UpdateSignUpQuestion = async (req: any, res: Response) => {
  try {
    const question_id = new mongoose.Types.ObjectId(req.body.id);
    const result = await CompleteProfile.findOneAndUpdate(
      {
        _id: question_id,
      },
      req.body.data
    );
    return res.status(200).send({
      status: true,
      message: "Question Updated",
    });
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const BlockUnblockUser = async (req: any, res: Response) => {
  try {
    const user_id = new mongoose.Types.ObjectId(req.body.user_id);
    const result = await User.findOneAndUpdate(
      {
        _id: user_id,
      },
      {
        is_user_active: req.body.set_status,
        is_deactivated_by_admin: !req.body.set_status,
      }
    );
    if (!req.body.set_status && req.body.user_id) {
      await redisClient.set(`user_${req.body.user_id}`, "");
    }
    return res.status(200).send({
      status: true,
      message: req.body.set_status ? "User Activated" : "User Deactivated",
    });
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const DeactivateUser = async (req: any, res: Response) => {
  try {
    const page = req.body?.page ? parseInt(req.body.page, 10) : 1;
    const pageSize = req.body?.size ? parseInt(req.body.size, 10) : 10;
    const skip = (page - 1) * pageSize;
    const searchValue = req.body?.searchValue || "";
    const users = await User.aggregate([
      {
        $match: {
          is_user_active: false,
          $or: [
            { first_name: { $regex: searchValue, $options: "i" } },
            { last_name: { $regex: searchValue, $options: "i" } },
          ],
        },
      },
      {
        $lookup: {
          from: "media",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$status", "active"] },
                    { $eq: ["$mediaType", "profile"] },
                  ],
                },
              },
            },
          ],
          as: "media",
        },
      },
      {
        $lookup: {
          from: "usersubscriptions",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user_id", "$$userId"] },
                    { $eq: ["$SubscriptionIsActive", true] },
                  ],
                },
              },
            },
          ],
          as: "subscriptions_plan",
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: pageSize,
      },
    ]);
    const totalUsers = await User.countDocuments({
      is_user_active: false,
      $or: [
        { first_name: { $regex: searchValue, $options: "i" } },
        { last_name: { $regex: searchValue, $options: "i" } },
      ],
    });
    return res.status(200).send({
      status: true,
      users: users,
      page: page,
      totalPages: Math.ceil(totalUsers / pageSize),
      pageSize: pageSize,
      totalUsers: totalUsers,
    });
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const DeletedUsers = async (req: any, res: Response) => {
  try {
    const page = req.body?.page ? parseInt(req.body.page, 10) : 1;
    const pageSize = req.body?.size ? parseInt(req.body.size, 10) : 10;
    const skip = (page - 1) * pageSize;
    const searchValue = req.body?.searchValue || "";
    const users = await User.aggregate([
      {
        $match: {
          is_user_active: false,
          is_deactivated_by_admin: false,
          $or: [
            { first_name: { $regex: searchValue, $options: "i" } },
            { last_name: { $regex: searchValue, $options: "i" } },
          ],
        },
      },
      {
        $lookup: {
          from: "media",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$status", "active"] },
                    { $eq: ["$mediaType", "profile"] },
                  ],
                },
              },
            },
          ],
          as: "media",
        },
      },
      {
        $lookup: {
          from: "usersubscriptions",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user_id", "$$userId"] },
                    { $eq: ["$SubscriptionIsActive", true] },
                  ],
                },
              },
            },
          ],
          as: "subscriptions_plan",
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: pageSize,
      },
    ]);
    const totalUsers = await User.countDocuments({
      is_user_active: false,
      is_deactivated_by_admin: false,
      $or: [
        { first_name: { $regex: searchValue, $options: "i" } },
        { last_name: { $regex: searchValue, $options: "i" } },
      ],
    });
    return res.status(200).send({
      status: true,
      users: users,
      page: page,
      totalPages: Math.ceil(totalUsers / pageSize),
      pageSize: pageSize,
      totalUsers: totalUsers,
    });
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const PaymentLogs = async (req: any, res: Response) => {
  try {
    const page = req.body?.page ? parseInt(req.body.page, 10) : 1;
    const pageSize = req.body?.size ? parseInt(req.body.size, 10) : 10;
    const dateStart = req?.body?.date_start
      ? new Date(req.body.date_start?.slice(0, 10) + "T00:00:00")
      : new Date("2024-05-06T00:00:00");
    const dateEnd = req?.body?.date_end
      ? new Date(req.body.date_end?.slice(0, 10) + "T23:59:00")
      : new Date();
    const user_id = req.body.user_id;
    const skip = (page - 1) * pageSize;
    const searchValue = req.body?.search || "";
    // Create a regex pattern to search case-insensitively
    const searchPattern = new RegExp(escapeRegex(searchValue), "i");
    // const searchPattern = new RegExp(searchValue, "i");
    const query = user_id
      ? {
          createdAt: {
            $gte: dateStart,
            $lte: dateEnd,
          },
          user_id: new mongoose.Types.ObjectId(user_id),
        }
      : {
          createdAt: {
            $gte: dateStart,
            $lte: dateEnd,
          },
        };
    const paymentLogsCount = await PaymentLogModel.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: "users",
          let: { userId: "$user_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$_id", "$$userId"] }],
                },
                $or: [
                  { first_name: { $regex: searchPattern } },
                  { last_name: { $regex: searchPattern } },
                  { mobile: { $regex: searchPattern } },
                ],
              },
            },
          ],
          as: "user",
        },
      },
      {
        $lookup: {
          from: "addonpurchases",
          let: { planId: "$plan_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$_id", "$$planId"] }],
                },
              },
            },
          ],
          as: "add_on_plan",
        },
      },
      {
        $lookup: {
          from: "subscriptions_plans",
          let: { planId: "$plan_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$_id", "$$planId"] }],
                },
              },
            },
          ],
          as: "subscription_plan",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          user_id: 1,
          transaction_type: 1,
          plan_id: 1,
          amount: 1,
          payment_status: 1,
          details: 1,
          createdAt: 1,
          payment_completed_at: 1,
          add_on_plan: {
            _id: 1,
            name: 1,
          },
          subscription_plan: {
            _id: 1,
            name: 1,
          },
          user: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            mobile: 1,
          },
        },
      },
    ]);
    const paymentLogs = await PaymentLogModel.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: "users",
          let: { userId: "$user_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    {
                      $eq: ["$_id", "$$userId"],
                    },
                  ],
                },
                $or: [
                  { first_name: { $regex: searchPattern } },
                  { last_name: { $regex: searchPattern } },
                  { mobile: { $regex: searchPattern } },
                ],
              },
            },
          ],
          as: "user",
        },
      },
      {
        $lookup: {
          from: "addonpurchases",
          let: { planId: "$plan_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$_id", "$$planId"] }],
                },
              },
            },
          ],
          as: "add_on_plan",
        },
      },
      {
        $lookup: {
          from: "subscriptions_plans",
          let: { planId: "$plan_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$_id", "$$planId"] }],
                },
              },
            },
          ],
          as: "subscription_plan",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 1,
          user_id: 1,
          transaction_type: 1,
          plan_id: 1,
          amount: 1,
          payment_status: 1,
          details: 1,
          createdAt: 1,
          payment_completed_at: 1,
          add_on_plan: {
            _id: 1,
            name: 1,
          },
          subscription_plan: {
            _id: 1,
            name: 1,
          },
          user: {
            _id: 1,
            first_name: 1,
            last_name: 1,
            mobile: 1,
          },
        },
      },
      {
        $skip: skip,
      },
      {
        $limit: pageSize,
      },
      {
        $sort: { createdAt: 1 },
      },
    ]);
    return res.status(200).send({
      status: true,
      logs: paymentLogs,
      page: page,
      totalPages: Math.ceil(paymentLogsCount.length / pageSize),
      pageSize: pageSize,
      totalLogs: paymentLogsCount.length,
    });
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const UpdateMaximumRadius = async (req: any, res: Response) => {
  try {
    const max_radius = req.body.radius;
    await Settings.updateOne({ name: "max_radius" }, { values: max_radius });
    return res.status(200).send({
      status: true,
    });
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const deleteChatSuggestion = async (req: any, res: Response) => {
  try {
    const _id = req?.body?.id;
    const getQuestion = await QuestionBank.findOne({ _id });
    if (getQuestion?.fisrtQues) {
      const findNextQuestion = await QuestionBank.findOne({
        _id: getQuestion.nextQuestion,
      });
      if (!findNextQuestion) {
        await QuestionBank.deleteOne({ _id });
        return res.status(200).send({
          status: true,
        });
      } else {
        await QuestionBank.updateOne(
          { _id: findNextQuestion?._id },
          { fisrtQues: true }
        );
        await QuestionBank.deleteOne({ _id });
        return res.status(200).send({
          status: true,
        });
      }
    } else {
      const findPreviousQuestion = await QuestionBank.findOne({
        nextQuestion: getQuestion?._id,
      });
      const findNextQues = await QuestionBank.findOne({
        _id: getQuestion?.nextQuestion,
      });

      if (findNextQues) {
        await QuestionBank.updateOne(
          { _id: findPreviousQuestion?._id },
          { nextQuestion: getQuestion?.nextQuestion }
        );
      } else
        await QuestionBank.updateOne(
          { _id: findPreviousQuestion?._id },
          { nextQuestion: null }
        );

      await QuestionBank.deleteOne({ _id });
      return res.status(200).send({
        status: true,
      });
    }
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const generateReports = async (req: Request, res: Response) => {
  try {
    const type = req.body.type;
    if (!type || !req.body.start_date || !req.body.end_date) {
      return res.status(400).send({
        status: false,
        message: "Please send all parameters",
      });
    }
    if (type == "payment_log") {
      const data = await adminServices.getPaymentLogAsPerDate(req.body);
      return res.status(200).send({
        status: true,
        data,
      });
    }

    if (type == "users") {
      const data = await adminServices.getUserAsPerCreatedDate(req.body);
      return res.status(200).send({
        status: true,
        data,
      });
    }

    if (type == "subscribed_users") {
      const data = await adminServices.getSubscribedUserAsPerPaymentDate(
        req.body
      );
      return res.status(200).send({
        status: true,
        data,
      });
    }

    if (type == "reported_users") {
      const data = await adminServices.getReportedUserAsPerDate(req.body);
      return res.status(200).send({
        status: true,
        data,
      });
    }
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};
