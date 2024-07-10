import User from "../../user/models/user.model";
import Announcement from "../../media/announcement.model";
import bcrypt from "bcryptjs";
import * as adminTypes from "../types/admin.interface";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import Interests from "../models/interest.model";
import Gender from "../models/genders.models";
import Occupation from "../models/occupation.models";
import { SendMail } from "../../helper/email";
import Report from "../../user/models/report.model";
import UserSubscription from "../../user/models/userSubscription.model";

import {
  GetUserProfileAllDetails,
  findUserByID,
} from "../../user/services/user.service";
import mongoose from "mongoose";
import { CommandListInstance } from "twilio/lib/rest/preview/wireless/command";
import CompleteProfile from "../models/completeMyProfile.models";
import { QuestionBank } from "../models/questionBank.model";
import { UserQuestionProgress } from "../models/userQuestionProgress.model";
import redisClient from "../../helper/radis";
import PaymentLogModel from "../../user/models/paymentLogs.model";
import { user } from "firebase-functions/v1/auth";
import SubscriptionModel from "../models/subscription.models";
import Sports from "../models/sport.model";
dotenv.config();
const secretKey = process.env.JWT_SECRET_KEY as string;
const escapeRegex = (string: string) => {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
};
export const generateSaltedPassword = async (
  password: string
): Promise<string> => {
  const saltRounds = 10;
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    throw new Error("Failed to generate salted password: " + error);
  }
};

export const generateToken = (payload: object) => {
  return jwt.sign(payload, secretKey, { expiresIn: "5m" }); // Expires in 5 minutes
};

export const loginAdmin = async (data: adminTypes.login, getUser: any) => {
  try {
    const email = data.email;
    const password = data.password;

    return bcrypt
      .compare(password, `${getUser?.password}`)
      .then(async (bResult) => {
        if (!bResult) {
          return {
            status: false,
            message: "Incorrect Password",
          };
        } else if (bResult) {
          const token = jwt.sign(
            { id: getUser._id, type: "admin" },
            `${process.env.JWT_SECRET_KEY}`,
            { expiresIn: process.env.JWT_EXPIRY_HOURS }
          );
          await redisClient.set(`user_${getUser._id}`, token);
          const userDetails = {
            message: "Admin Signed In",
            status: true,
            token: token,
            user_details: {
              _id: getUser._id,
              first_name: getUser.first_name,
              last_name: getUser.last_name,
              email: getUser.email,
              IsAdmin: getUser.IsAdmin,
            },
          };
          return userDetails;
        }
      });
  } catch (err) {
    console.error("loginAdmin errrr", err);
    return {
      status: true,
      message: "Something went wrong",
    };
  }
};
export const genrateNewHashPass = async (password: string) => {
  try {
    if (password) {
      const newPass = await bcrypt.hash(
        password,
        Number(process.env.PWD_HASHING_TIMES)
      );
      if (newPass) {
        return newPass;
      } else {
        return false;
      }
    }
  } catch (err) {
    console.error("genrateNewHashPass err", err);
    return false;
  }
};
export const forgotPassword = async (data: adminTypes.forgotpass) => {
  try {
    // const current_password = data?.current_password;
    // const new_password = data?.new_password;
    const email = data?.email;
    const user: any = await User.findOne({ email: email });
    if (user && user?.IsAdmin) {
      const token = generateToken({ email: user.email });
      const html =
        "<h1>Reset kr le password</h1><br> the link is http://localhost:3000/auth/reset-password/" +
        token;
      const sendmail = await SendMail(
        email,
        "Reset Email from Hotspot meet",
        html
      );
      return {
        status: true,
        message:
          "Password reset link send to email.waha jake click kr or reset kr le",
      };

      //   const passresult = await bcrypt.compare(
      //     current_password,
      //     `${user?.password}`
      //   );
      //   if (passresult) {
      //     const hashedPass = await genrateNewHashPass(new_password);
      //     user.password = hashedPass;
      //     await user.save();
      //     return {
      //       status: true,
      //       message: "Password changed please login again",
      //     };
      //   } else {
      //     return {
      //       status: false,
      //       message: "Incorrect password",
      //     };
      //   }
    } else {
      return {
        status: false,
        message: "No user exist with this email address",
      };
    }
  } catch (err) {
    console.error("errerrerrerr", err);
  }
};

export const makeNewAdmin = async (data: adminTypes.login) => {
  const email = data.email;
  const password = data.password;
  const first_name = data.first_name;
  const last_name = data.last_name;
  const verifyToken = data.verifyToken;
  const authToken = process.env.ADMIN_CREATE_TOKEN;
  const getUser = await User.findOne({
    email: email,
  });
  if (getUser) {
    return {
      message: "User already exists with email!",
      status: false,
    };
  } else {
    if (verifyToken == authToken) {
      const newPass = await bcrypt.hash(
        password,
        Number(process.env.PWD_HASHING_TIMES)
      );
      if (newPass) {
        const newAdmin = new User({
          first_name: first_name,
          last_name: last_name,
          email: email,
          password: newPass,
          IsAdmin: true,
        });
        const createNewAdmin = await newAdmin.save();
        if (createNewAdmin) {
          return {
            message: "New Admin Created",
            status: true,
          };
        }
      }
      return {
        message: "Cannot hash password",
        status: false,
      };
    } else {
      return {
        message: "Invalid Auth Token",
        status: false,
      };
    }
  }
};

export const AddUpdateInterests = async (
  data: Array<adminTypes.Interest>,
  user: any
) => {
  const userDetails = await User.findOne({
    _id: user.id,
  });
  if (userDetails?.IsAdmin == true) {
    if (data?.length) {
      await Interests.deleteMany({});
      await Interests.insertMany(data);
      return {
        status: true,
        message: "Data Saved Successfully",
      };
    } else {
      return {
        status: false,
        message: "Please Send Correct Data",
      };
    }
  } else {
    return {
      status: false,
      message: "Unauthorized Access",
    };
  }
};

export const AddUpdateGenders = async (
  data: Array<adminTypes.Gender>,
  user: any
) => {
  const userDetails = await User.findOne({
    _id: user.id,
  });
  if (userDetails?.IsAdmin == true) {
    if (data?.length) {
      await Gender.deleteMany({});
      await Gender.insertMany(data);
      return {
        status: true,
        message: "Data Saved Successfully",
      };
    } else {
      return {
        status: false,
        message: "Please Send Correct Data",
      };
    }
  } else {
    return {
      status: false,
      message: "Unauthorized Access",
    };
  }
};

export const AddUpdateOccupation = async (
  data: Array<adminTypes.Gender>,
  user: any
) => {
  const userDetails = await User.findOne({
    _id: user.id,
  });
  if (userDetails?.IsAdmin == true) {
    if (data?.length) {
      await Occupation.deleteMany({});
      await Occupation.insertMany(data);
      return {
        status: true,
        message: "Data Saved Successfully",
      };
    } else {
      return {
        status: false,
        message: "Please Send Correct Data",
      };
    }
  } else {
    return {
      status: false,
      message: "Unauthorized Access",
    };
  }
};

export const AddUpdateSports = async (
  data: Array<adminTypes.Sports>,
  user: any
) => {
  const userDetails = await User.findOne({
    _id: user.id,
  });
  if (userDetails?.IsAdmin == true) {
    if (data?.length) {
      await Sports.deleteMany({});
      await Sports.insertMany(data);
      return {
        status: true,
        message: "Data Saved Successfully",
      };
    } else {
      return {
        status: false,
        message: "Please Send Correct Data",
      };
    }
  } else {
    return {
      status: false,
      message: "Unauthorized Access",
    };
  }
};

export const CompleteUserProfile = async (
  data: Array<adminTypes.Gender>,
  user: any
) => {
  const userDetails = await User.findOne({
    _id: user.id,
  });
  if (userDetails?.IsAdmin == true) {
    if (data?.length) {
      await CompleteProfile.deleteMany({});
      await CompleteProfile.insertMany(data);
      return {
        status: true,
        message: "Data Saved Successfully",
      };
    } else {
      return {
        status: false,
        message: "Please Send Correct Data",
      };
    }
  } else {
    return {
      status: false,
      message: "Unauthorized Access",
    };
  }
};
export const getAllUsers = async (data: adminTypes.GetallUser) => {
  try {
    const page = data?.page ? parseInt(data.page, 10) : 1;
    const pageSize = data?.size ? parseInt(data.size, 10) : 10;
    const skip = (page - 1) * pageSize;
    const searchValue = data?.searchValue || "";

    // Create a regex pattern to search case-insensitively

    const searchPattern = new RegExp(escapeRegex(searchValue), "i");
    const query: any = {
      IsprofileComplete: true,
    };

    if (data?.status) {
      query["is_user_active"] = data.status == "active" ? true : false;
    }

    // Build the query object
    const searchQuery = searchValue
      ? {
          ...query,
          $or: [
            { first_name: { $regex: searchPattern } },
            { last_name: { $regex: searchPattern } },
            { mobile: { $regex: searchPattern } },
          ],
        }
      : {
          ...query,
        };
    const users = await User.aggregate([
      {
        $lookup: {
          from: "usersubscriptions",
          //   localField: '_id',
          //   foreignField: 'userId',
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
        $lookup: {
          from: "media",
          //   localField: '_id',
          //   foreignField: 'userId',
          let: { user_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$user_id"] },
                    { $eq: ["$status", "active"] },
                    { $eq: ["$mediaType", "profile"] },
                  ],
                },
              },
            },
          ],
          as: "profile_image",
        },
      },
      {
        $match: searchQuery,
      },
      {
        $project: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          mobile: 1,
          profile_image: 1,
          is_user_active: 1,
          isOnline: 1,
          subscriptions_plan: 1,
          timestamp: 1,
        },
      },
    ])
      // .select('first_name last_name mobile email gender is_user_active')
      // .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

    const totalUsers = await User.countDocuments(searchQuery);

    return {
      users: users,
      page: page,
      totalPages: Math.ceil(totalUsers / pageSize),
      pageSize: pageSize,
      totalUsers: totalUsers,
    };
  } catch (err) {
    console.error("getAllUsers err", err);
    return {
      status: false,
      message: "Something went wrong",
    };
  }
};

export const getAllUsersCount = async () => {
  try {
    // Create a regex pattern to search case-insensitively
    const totalUsers = await User.countDocuments({ IsprofileComplete: true });

    return {
      totalUsers: totalUsers,
    };
  } catch (err) {
    console.error("getAllUsers err", err);
    return {
      status: false,
      message: "Something went wrong",
    };
  }
};

export const getAllSubscribedUsers = async (data: adminTypes.GetallUser) => {
  try {
    const page = data?.page ? parseInt(data.page, 10) : 1;
    const pageSize = data?.size ? parseInt(data.size, 10) : 10;
    const skip = (page - 1) * pageSize;
    const searchValue = data?.searchValue || "";

    // Create a regex pattern to search case-insensitively

    const searchPattern = new RegExp(escapeRegex(searchValue), "i");
    // const searchPattern = new RegExp(searchValue, "i");

    const query: any = {
      IsprofileComplete: true,
    };

    if (data?.status) {
      query["is_user_active"] = data.status == "active" ? true : false;
    }

    // Build the query object
    const searchQuery = searchValue
      ? {
          ...query,
          $or: [
            { first_name: { $regex: searchPattern } },
            { last_name: { $regex: searchPattern } },
          ],
        }
      : {
          ...query,
        };

    const usersCount = await User.aggregate([
      {
        $lookup: {
          from: "usersubscriptions",
          //   localField: '_id',
          //   foreignField: 'userId',
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
        $match: searchQuery,
      },
      {
        $project: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          mobile: 1,
          profile_image: 1,
          is_user_active: 1,
          isOnline: 1,
          subscriptions_plan: 1,
        },
      },
      {
        $match: {
          $and: [{ subscriptions_plan: { $not: { $size: 0 } } }],
        }, // Allows documents where requestStatus is not "pending"
      },
    ]);
    const users = await User.aggregate([
      {
        $lookup: {
          from: "usersubscriptions",
          //   localField: '_id',
          //   foreignField: 'userId',
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
        $lookup: {
          from: "media",
          //   localField: '_id',
          //   foreignField: 'userId',
          let: { user_id: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$user_id"] },
                    { $eq: ["$status", "active"] },
                    { $eq: ["$mediaType", "profile"] },
                  ],
                },
              },
            },
          ],
          as: "profile_image",
        },
      },
      {
        $match: searchQuery,
      },
      {
        $project: {
          _id: 1,
          first_name: 1,
          last_name: 1,
          mobile: 1,
          profile_image: 1,
          is_user_active: 1,
          isOnline: 1,
          subscriptions_plan: 1,
        },
      },
      {
        $match: {
          $and: [{ subscriptions_plan: { $not: { $size: 0 } } }],
        }, // Allows documents where requestStatus is not "pending"
      },
    ])
      // .select('first_name last_name mobile email gender is_user_active')
      // .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .exec();

    // const totalUsers = await User.countDocuments(searchQuery);

    return {
      users: users,
      page: page,
      totalPages: Math.ceil(usersCount.length / pageSize),
      pageSize: pageSize,
      totalUsers: usersCount.length,
    };
  } catch (err) {
    console.error("getAllUsers err", err);
    return {
      status: false,
      message: "Something went wrong",
    };
  }
};

export const getAllRepotedUsers = async (
  data: adminTypes.GetallReportedUser,
  user: any
) => {
  try {
    const page = parseInt(data?.page) || 1;
    const limit = parseInt(data?.limit) || 10;
    const search = data?.searchValue || "";
    const countAggregation = [
      {
        $match: {
          $or: [
            { "reporterDetails.first_name": { $regex: search, $options: "i" } },
            { "reporterDetails.last_name": { $regex: search, $options: "i" } },
            { "reporterDetails.email": { $regex: search, $options: "i" } },
            { "reportedDetails.first_name": { $regex: search, $options: "i" } },
            { "reportedDetails.last_name": { $regex: search, $options: "i" } },
            { "reportedDetails.email": { $regex: search, $options: "i" } },
          ],
        },
      },
    ];

    const totalCountResult = await Report.countDocuments(countAggregation);
    // const total = totalCountResult.length > 0 ? totalCountResult[0].total : 0;
    const totalPages = Math.ceil(totalCountResult / limit);

    // Fetch paginated reported users with their details
    const reportedUsers = await Report.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "reportedUserId",
          foreignField: "_id",
          as: "reportedDetails",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reporterUserId",
          foreignField: "_id",
          as: "reporterDetails",
        },
      },
      // Unwinding the details to make them easier to match against
      {
        $unwind: { path: "$reportedDetails", preserveNullAndEmptyArrays: true },
      },
      {
        $unwind: { path: "$reporterDetails", preserveNullAndEmptyArrays: true },
      },
      // Now, apply the search filter
      {
        $match: {
          $or: [
            { "reporterDetails.first_name": { $regex: search, $options: "i" } },
            { "reporterDetails.last_name": { $regex: search, $options: "i" } },
            { "reporterDetails.email": { $regex: search, $options: "i" } },
            { "reportedDetails.first_name": { $regex: search, $options: "i" } },
            { "reportedDetails.last_name": { $regex: search, $options: "i" } },
            { "reportedDetails.email": { $regex: search, $options: "i" } },
          ],
        },
      },
      // Continue with additional $lookup stages for media
      {
        $lookup: {
          from: "media",
          let: { userId: "$reportedDetails._id" },
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
          as: "reportedUserMedia",
        },
      },
      {
        $lookup: {
          from: "media",
          let: { userId: "$reporterDetails._id" },
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
          as: "reporterUserMedia",
        },
      },
      // Apply pagination after all filters
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 1,
          reporterUserId: 1,
          reportedUserId: 1,
          message: 1,
          timestamp: 1,
          reportedDetails: {
            _id: "$reportedDetails._id",
            first_name: "$reportedDetails.first_name",
            last_name: "$reportedDetails.last_name",
            email: "$reportedDetails.email",
            is_user_active: "$reportedDetails.is_user_active",
            media: "$reportedUserMedia",
          },
          reporterDetails: {
            _id: "$reporterDetails._id",
            first_name: "$reporterDetails.first_name",
            last_name: "$reporterDetails.last_name",
            email: "$reporterDetails.email",
            media: "$reporterUserMedia",
          },
        },
      },
    ]);

    // const reportedUsers = await Report.aggregate(reportAggregation);
    return {
      users: reportedUsers,
      page: page,
      totalPages: totalPages,
      pageSize: limit,
      totalUsers: totalCountResult,
    };
  } catch (err) {
    console.error("getAllUsers err", err);
    return {
      status: false,
      message: "Something went wrong",
    };
  }
};

export const ViewUserDetails = async (data: adminTypes.getUserData) => {
  try {
    const user_id = new mongoose.Types.ObjectId(data?.id);
    const user: any = await GetUserProfileAllDetails(user_id);

    if (user) {
      return {
        user_details: user,
        status: false,
        message: "User not found",
      };
    } else {
      return {
        status: false,
        message: "User not found",
      };
    }
  } catch (err) {
    console.error("ViewUserDetails err", err);
    return {
      status: false,
      message: "Something went wrong",
    };
  }
};

export const getAllSubscribedUsersCount = async () => {
  try {
    const query: any = {};

    query["is_user_active"] = true;

    // Build the query object
    const searchQuery = {
      ...query,
    };

    const usersCount = await User.aggregate([
      {
        $lookup: {
          from: "usersubscriptions",
          //   localField: '_id',
          //   foreignField: 'userId',
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
        $match: searchQuery,
      },
      {
        $match: {
          $and: [{ subscriptions_plan: { $not: { $size: 0 } } }],
        }, // Allows documents where requestStatus is not "pending"
      },
    ]);

    return {
      totalUsers: usersCount.length,
    };
  } catch (err) {
    console.error("getAllUsers err", err);
    return {
      status: false,
      message: "Something went wrong",
    };
  }
};

export const addNewQuestion = async (data: any) => {
  try {
    const newQuestion = new QuestionBank(data);
    await newQuestion.save();
    if (newQuestion) {
      await QuestionBank.findOneAndUpdate(
        {
          nextQuestion: { $eq: null },
          _id: { $ne: newQuestion._id },
        },
        { $set: { nextQuestion: newQuestion._id } }
      );
    }

    return {
      status: false,
      data,
      message: "Error while getting data",
    };
  } catch (err) {
    console.error("addNewQuestion", err);
    return {
      status: false,
      message: "Error while getting data",
    };
  }
};

async function updateQuestionForUsers(
  initiatorId: string,
  receiverId: string,
  conversationId: string,
  questionId: string
) {
  // Update for the initiator
  await UserQuestionProgress.findOneAndUpdate(
    { user: initiatorId, conversation: conversationId },
    { currentQuestion: questionId, questionInitiator: initiatorId },
    { upsert: true, new: true }
  );

  // Update for the receiver (set the questionInitiator)
  await UserQuestionProgress.findOneAndUpdate(
    { user: receiverId, conversation: conversationId },
    { currentQuestion: questionId, questionInitiator: initiatorId },
    { upsert: true, new: true }
  );
}

export const getAllAnnouncements = async (
  data: adminTypes.GetAllAnnouncements
) => {
  try {
    const page = data?.page ? parseInt(data.page, 10) : 1;
    const pageSize = data?.size ? parseInt(data.size, 10) : 10;
    const skip = (page - 1) * pageSize;
    const searchValue = data?.searchValue || "";

    // Create a regex pattern to search case-insensitively
    const searchPattern = new RegExp(searchValue, "i");

    const query: any = {};
    // Build the query object
    const searchQuery = searchValue
      ? {
          ...query,
          $or: [
            { title: { $regex: searchPattern } },
            { description: { $regex: searchPattern } },
          ],
        }
      : {
          ...query,
        };
    const Announcements = await Announcement.aggregate([
      {
        $match: searchQuery,
      },
    ])
      .skip(skip)
      .limit(pageSize)
      .exec();

    const totalAnnouncements = await Announcement.countDocuments(searchQuery);

    return {
      announcements: Announcements,
      page: page,
      totalPages: Math.ceil(totalAnnouncements / pageSize),
      pageSize: pageSize,
      totalAnnouncements: totalAnnouncements,
    };
  } catch (err) {
    console.error("getAnnouncements err", err);
    return {
      status: false,
      message: "Something went wrong",
    };
  }
};

export const getStatsService = async () => {
  try {
    const users = await getAllUsersCount();
    const subscribed_users = await getAllSubscribedUsersCount();
    const totalReportedUsers = await Report.countDocuments();
    const subscribedUsers = await UserSubscription.find({
      payment_status: "paid",
    });
    // let evaluateRevenue = 0;
    // subscribedUsers.map((item) => (evaluateRevenue += item.price));
    const total_revenue = await PaymentLogModel.aggregate([
      {
        $match: {
          payment_status: "completed", // Filter documents where payment_status is 'completed'
        },
      },
      {
        $group: {
          _id: null, // Grouping key - null means to group all documents
          totalAmount: { $sum: "$amount" }, // Sum up all the amounts
        },
      },
    ]);
    return {
      users: users.totalUsers,
      subscribed_users: subscribed_users.totalUsers,
      revenue: total_revenue,
      reported_users: totalReportedUsers,
    };
  } catch (err) {
    console.error("getAnnouncements err", err);
    return {
      status: false,
      message: "Something went wrong",
    };
  }
};

export const getPaymentLogAsPerDate = async (body: any) => {
  let startDate = body?.start_date
    ? new Date(body?.start_date?.slice(0, 10) + "T00:00:00")
    : new Date("2024-05-06T00:00:00");
  let endDate = body?.end_date
    ? new Date(body?.end_date?.slice(0, 10) + "T23:59:00")
    : new Date();
  const paymentLogs = await PaymentLogModel.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
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
      $sort: { createdAt: 1 },
    },
  ]);

  return paymentLogs;
};
export const getUserAsPerCreatedDate = async (body: any) => {
  let startDate = body?.start_date
    ? new Date(body?.start_date?.slice(0, 10) + "T00:00:00")
    : new Date("2024-05-06T00:00:00");
  let endDate = body?.end_date
    ? new Date(body?.end_date?.slice(0, 10) + "T23:59:00")
    : new Date();
  const users = User.find({
    timestamp: {
      $gte: startDate,
      $lt: endDate,
    },
  });
  return users;
};
export const getSubscribedUserAsPerPaymentDate = async (body: any) => {
  let startDate = body?.start_date
    ? new Date(body?.start_date?.slice(0, 10) + "T00:00:00")
    : new Date("2024-05-06T00:00:00");
  let endDate = body?.end_date
    ? new Date(body?.end_date?.slice(0, 10) + "T23:59:00")
    : new Date();
  const subscriberUsers = UserSubscription.aggregate([
    {
      $match: {
        payment_done_at: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user_details",
      },
    },
    {
      $unwind: "$user_details", // Unwinding to flatten the user_details if needed
    },
    {
      $project: {
        // Limiting the fields returned
        "user_details.first_name": 1,
        "user_details.last_name": 1,
        "user_details.mobile": 1,
        plan_name: 1,
        price: 1,
        payment_status: 1,
        payment_done_at: 1,
        description: 1,
        billing_duration: 1,
        timestamp: 1,
      },
    },
    {
      $sort: { timestamp: 1 },
    },
  ]);

  return subscriberUsers;
};
export const getReportedUserAsPerDate = async (body: any) => {
  let startDate = body?.start_date
    ? new Date(body?.start_date?.slice(0, 10) + "T00:00:00")
    : new Date("2024-05-06T00:00:00");
  let endDate = body?.end_date
    ? new Date(body?.end_date?.slice(0, 10) + "T23:59:00")
    : new Date();
  const reportedUsers = Report.aggregate([
    {
      $match: {
        timestamp: {
          $gte: startDate,
          $lt: endDate,
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "reporterUserId",
        foreignField: "_id",
        as: "reporterUser",
      },
    },
    {
      $unwind: "$reporterUser", // Unwinding to flatten the user_details if needed
    },
    {
      $lookup: {
        from: "users",
        localField: "reportedUserId",
        foreignField: "_id",
        as: "reportedUser",
      },
    },
    {
      $unwind: "$reportedUser", // Unwinding to flatten the user_details if needed
    },
    {
      $project: {
        _id: 1,
        message: 1,
        timestamp: 1,
        "reporterUser.first_name": 1,
        "reporterUser.last_name": 1,
        "reporterUser.mobile": 1,
        "reportedUser.first_name": 1,
        "reportedUser.last_name": 1,
        "reportedUser.mobile": 1,
      },
    },
    {
      $sort: { timestamp: 1 },
    },
  ]);

  return reportedUsers;
};
