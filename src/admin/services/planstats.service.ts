import PaymentLogModel from "../../user/models/paymentLogs.model";
import { Types } from "mongoose";

export interface UserListQuery {
  planId: string;
  search?: string;
  limit?: number;
  page?: number;
}

interface Query {
  startDate?: string;
  endDate?: string;
}

export const getPlanStatsService = async (query: Query) => {
  const { startDate, endDate } = query;
  try {
    const matchConditions: any = { payment_status: "completed" };

    if (startDate || endDate) {
      matchConditions.createdAt = {};
      if (startDate && endDate && startDate === endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchConditions.createdAt.$gte = start;
        matchConditions.createdAt.$lte = end;
      } else {
        if (startDate) {
          matchConditions.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          matchConditions.createdAt.$lte = new Date(endDate);
        }
      }
    }

    const planStats = await PaymentLogModel.aggregate([
      {
        $match: matchConditions,
      },
      {
        $group: {
          _id: "$plan_id",
          totalRevenue: { $sum: "$amount" },
          uniqueUserIds: { $addToSet: "$user_id" },
        },
      },
      {
        $lookup: {
          from: "subscriptions_plans",
          localField: "_id",
          foreignField: "_id",
          as: "planDetails",
        },
      },
      {
        $unwind: "$planDetails",
      },
      {
        $project: {
          _id: 0,
          plan_id: "$_id",
          planName: "$planDetails.name",
          totalRevenue: 1,
          totalSubscribedUsers: { $size: "$uniqueUserIds" },
        },
      },
      {
        $match: {
          planName: { $exists: true },
        },
      },
      {
        $sort: {
          planName: 1,
        },
      },
    ]);

    return {
      status: true,
      data: planStats,
    };
  } catch (err) {
    console.error("getPlanStatsService err", err);
    return {
      status: false,
      message: "Something went wrong",
    };
  }
};

export const getAddOnPlanStatsService = async (query: Query) => {
  const { startDate, endDate } = query;
  try {
    const matchConditions: any = { payment_status: "completed" };

    if (startDate || endDate) {
      matchConditions.createdAt = {};
      if (startDate && endDate && startDate === endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchConditions.createdAt.$gte = start;
        matchConditions.createdAt.$lte = end;
      } else {
        if (startDate) {
          matchConditions.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          matchConditions.createdAt.$lte = new Date(endDate);
        }
      }
    }

    const planStats = await PaymentLogModel.aggregate([
      {
        $match: matchConditions,
      },
      {
        $group: {
          _id: "$plan_id",
          totalRevenue: { $sum: "$amount" },
          totalUsers: { $addToSet: "$user_id" },
        },
      },
      {
        $lookup: {
          from: "addonpurchases",
          localField: "_id",
          foreignField: "_id",
          as: "addOnplanDetails",
        },
      },
      {
        $unwind: "$addOnplanDetails",
      },

      {
        $lookup: {
          from: "users",
          localField: "totalUsers",
          foreignField: "_id",
          as: "users",
        },
      },
      {
        $project: {
          _id: 0,
          plan_id: "$_id",
          planName: "$addOnplanDetails.name",
          totalRevenue: 1,
          totalSubscribedUsers: { $size: "$totalUsers" },
        },
      },
      {
        $match: {
          planName: { $exists: true },
        },
      },
      {
        $sort: {
          planName: 1,
        },
      },
    ]);

    return {
      status: true,
      data: planStats,
    };
  } catch (err) {
    console.error("getPlanStatsService err", err);
    return {
      status: false,
      message: "Something went wrong",
    };
  }
};

export const getAllUsersForPlan = async (query: UserListQuery) => {
  const planObjectId = new Types.ObjectId(query.planId);

  const limitNum = query.limit || 10;
  const pageNum = query.page || 1;
  const searchRegex = query.search ? new RegExp(query.search, "i") : null;

  const pipeline = [
    {
      $match: {
        plan_id: planObjectId,
        payment_status: "completed",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "media",
        localField: "user._id",
        foreignField: "userId",
        as: "media",
      },
    },
    {
      $lookup: {
        from: "subscriptions_plans",
        localField: "plan_id",
        foreignField: "_id",
        as: "subscriptionPlan",
      },
    },
    {
      $lookup: {
        from: "addonpurchases",
        localField: "plan_id",
        foreignField: "_id",
        as: "addonPlan",
      },
    },
    {
      $addFields: {
        planName: {
          $cond: {
            if: { $gt: [{ $size: "$subscriptionPlan" }, 0] },
            then: { $arrayElemAt: ["$subscriptionPlan.name", 0] },
            else: { $arrayElemAt: ["$addonPlan.name", 0] },
          },
        },
        profileImage: {
          $arrayElemAt: ["$media.mediaUrl", 0],
        },
      },
    },
    {
      $group: {
        _id: "$user._id",
        user: { $first: "$user" },
        profileImage: { $first: "$profileImage" },
        planName: { $first: "$planName" },
        planAmount: { $first: "$amount" },
        userRepeatThisPlan: { $sum: 1 },
      },
    },
    {
      $match: searchRegex
        ? {
            $or: [
              { "user.first_name": searchRegex },
              { "user.last_name": searchRegex },
              { "user.mobile": searchRegex },
            ],
          }
        : {},
    },
    {
      $facet: {
        data: [
          { $skip: (pageNum - 1) * limitNum },
          { $limit: limitNum },
          {
            $addFields: {
              user_id: "$_id",
            },
          },
          {
            $project: {
              _id: 0,
              user_id: 1,
              firstName: "$user.first_name",
              lastName: "$user.last_name",
              is_user_active: "$user.is_user_active",
              mobile: "$user.mobile",
              profileImage: 1,
              planName: 1,
              planPrice: "$planAmount",
              userRepeatThisPlan: 1,
            },
          },
        ],
        totalUsers: [{ $count: "count" }],
      },
    },
    {
      $project: {
        data: 1,
        totalUsers: { $arrayElemAt: ["$totalUsers.count", 0] },
      },
    },
  ];

  const result = await PaymentLogModel.aggregate(pipeline).exec();

  const totalUsers = result[0]?.totalUsers || 0;
  const totalPages = Math.ceil(totalUsers / limitNum);

  return {
    data: result[0]?.data || [],
    totalUsers,
    totalPages,
    currentPage: pageNum,
  };
};
