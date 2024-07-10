import dotenv from "dotenv";
dotenv.config();
import User from "../models/user.model";
import Interests from "../../admin/models/interest.model";
import Gender from "../../admin/models/genders.models";
import * as userTpes from "../user.interface";
import MobileOTP from "../models/verifyOtp.model";
import jwt from "jsonwebtoken";
import Occupation from "../../admin/models/occupation.models";
import { OAuth2Client } from "google-auth-library";
import * as UserInterface from "../user.interface";
import admin from "../../helper/firebase/firebase.config";
import Swipe from "../models/swipe.model";
import Match from "../models/match.model";
import UserFCM from "../models/userfcm.model";
import mongoose from "mongoose";
import Media from "../../media/media.model";
import Report from "../models/report.model";
import Block from "../models/block.model";
const client_id =
  "959857594400-4nj1c4j7lma3jl2ggij6thbhc9nis0nd.apps.googleusercontent.com";
import Story from "../models/story.model";
import Comment from "../models/comment.model";
import Chat from "../models/chat.model";
import SubscriptionModel from "../../admin/models/subscription.models";
import UserSubscription from "../models/userSubscription.model";
import CompleteProfile from "../../admin/models/completeMyProfile.models";
import { getUserSocketId, sendOfflineEvent } from "../../socket";
import { addFcmJob } from "../../helper/Queues/pushQueue";
import redisClient from "../../helper/radis";
import CallLogs from "../models/callLogs.model";
import AddOnPurchaseModel from "../../admin/models/addon.model";
import FreePlan, { IFreePlan } from "../models/freePlans.model";
import UserFreePlan from "../models/userFreePlan.model";
import UserAddOnModel from "../models/userAddon.model";
import Settings from "../../admin/models/admin.settings.model";
import Message from "../models/message.model";
import { Response } from "express";
import axios from "axios";
import jwkToPem from "jwk-to-pem";
import { stripeApp } from "../../helper/stripe";
import Sports from "../../admin/models/sport.model";
const googleClient = new OAuth2Client(client_id);
const jwtSecret: string = `${process.env.JWT_SECRET_KEY}`;
const tokenExpiresIn = process.env.JWT_EXPIRY_HOURS;
const accountSid = process.env.accountSid;
const authToken = process.env.authToken;
const client = require("twilio")(accountSid, authToken);

export const register = async (
  data: UserInterface.register,
  user_id: string
) => {
  try {
    const userIdAsObjectId = new mongoose.Types.ObjectId(user_id);
    const parts = data?.dob?.split("/");
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    const parsedDate = new Date(`${year}-${month}-${day}`);
    const newUser = {
      first_name: data?.first_name.trim(),
      last_name: data?.last_name.trim(),
      IsAdmin: false,
      isOnline: true,
      interest: data?.interest,
      location: {
        type: "Point",
        coordinates: [0, 0],
      },
      IsprofileComplete: true,
      bio: data?.bio,
      dob: parsedDate,
      gender: data?.gender,
      age_range: data?.age_range,
      interested_in: data?.interested_in,
      work: data?.work,
      sports: data?.sports,
      timestamp: new Date(),
    };
    const updatedUser: any = await User.findOneAndUpdate(
      {
        _id: userIdAsObjectId,
      },
      newUser
    );
    const userDetails = await User.findById({ _id: user_id });
    const UserImages = await Media.find({
      user_id: userIdAsObjectId,
      status: "active",
    });
    if (updatedUser) {
      const getfreePlan: IFreePlan | null = await FreePlan.findOne({
        is_active: true,
      });
      if (getfreePlan) {
        await UserFreePlan.create({
          user_id: userIdAsObjectId,
          name: getfreePlan.name,
          swipes: getfreePlan.swipes,
          connects: getfreePlan.connects,
          chat: getfreePlan.chat,
          freePlanId: getfreePlan._id,
          video_audio_call: getfreePlan.video_audio_call,
          renewalDate: new Date(
            new Date().setDate(new Date().getDate() + getfreePlan.renewalTime)
          ),
        });
      }
    }
    return {
      userDetails,
      UserImages,
      status: true,
      message: "User registered successfully",
    };
  } catch (err) {
    console.error("errerrerr", err);
    return {
      status: false,
      message: "Cannot create new user",
    };
  }
};

export const findUserByWhere = async (where: any) => {
  try {
    const findUser = await User.findOne(where);
    if (findUser) {
      return findUser;
    } else {
      return false;
    }
  } catch (err) {
    return false;
  }
};

export const findUserByMobile = async (mobile: bigint) => {
  try {
    const findUser = await User.findOne({ mobile: mobile });
    if (findUser) {
      return findUser;
    } else {
      return false;
    }
  } catch (err) {
    return false;
  }
};

export const findUserByID = async (id: any) => {
  try {
    const user = await User.findById(id);
    if (user?.is_user_active) {
      const user_images = await Media.find({ userId: id, status: "active" });
      const stories = await Story.find({ user_id: id });
      const user_id = new mongoose.Types.ObjectId(id);
      const getUserDetails = await User.aggregate([
        {
          $match: {
            _id: user_id,
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
            from: "stories",
            let: { userId: "$_id", viewUserID: user_id },
            pipeline: [
              { $match: { $expr: { $eq: ["$user_id", "$$userId"] } } },
              {
                $addFields: {
                  isSeen: {
                    $in: [
                      "$$viewUserID",
                      {
                        $map: {
                          input: "$views",
                          as: "view",
                          in: "$$view.user_id",
                        },
                      },
                    ],
                  },
                },
              },
              { $project: { _id: 1, isSeen: 1 } },
            ],
            as: "stories",
          },
        },
        {
          $lookup: {
            from: "usersubscriptions",
            localField: "_id",
            foreignField: "user_id",
            as: "subscription",
          },
        },
      ]);
      const userUage = await calculateUserBenefits(id);
      const userDetails = {
        user,
        user_images,
        stories,
        getUserDetails: getUserDetails.length ? getUserDetails[0] : {},
        benift_available: userUage,
      };
      return userDetails;
    } else {
      return false;
      // return {
      //   status: false,
      //   message: "User not found on Hotspot",
      // };
    }
  } catch (err) {
    console.error("errrrrrrr", err);
    return false;
  }
};

export const GetUserProfileAllDetails = async (id: any) => {
  try {
    const user_id = new mongoose.Types.ObjectId(id);
    const getUserDetails: any = await User.aggregate([
      {
        $match: {
          _id: user_id,
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
          from: "stories",
          let: { userId: "$_id", viewUserID: user_id },
          pipeline: [
            { $match: { $expr: { $eq: ["$user_id", "$$userId"] } } },
            {
              $addFields: {
                isSeen: {
                  $in: [
                    "$$viewUserID",
                    {
                      $map: {
                        input: "$views",
                        as: "view",
                        in: "$$view.user_id",
                      },
                    },
                  ],
                },
              },
            },
            { $project: { _id: 1, isSeen: 1 } },
          ],
          as: "stories",
        },
      },
      {
        $lookup: {
          from: "useractiveplans",
          localField: "_id",
          foreignField: "user_id",
          as: "subscription",
        },
      },
      // {
      //   $lookup: {
      //     from: "usersubscriptions",
      //     localField: "_id",
      //     foreignField: "user_id",
      //     as: "payment",
      //   },
      // },
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
            // {
            //   $lookup: {
            //     from: "subscriptions_plans",
            //     localField: "stripe_product_id",
            //     foreignField: "stripe_product_id",
            //     as: "original_plan_details",
            //   },
            // },
            // {
            //   $unwind: "$original_plan_details", // Use $unwind if the plan details are expected to be a single document
            // },
          ],
          as: "plan_details",
        },
      },
      {
        $lookup: {
          from: "useraddons",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$user_id", "$$userId"] },
                    { $eq: ["$is_active", true] },
                  ],
                },
              },
            },
            // {
            //   $lookup: {
            //     from: "addonpurchases",
            //     localField: "addon_id",
            //     foreignField: "_id",
            //     as: "original_addon_details",
            //   },
            // },
            // {
            //   $unwind: "$original_addon_details", // Use $unwind if the addon details are expected to be a single document
            // },
          ],
          as: "addon_details",
        },
      },
      {
        $addFields: {
          completionPercentage: {
            $multiply: [
              {
                $divide: [
                  {
                    $sum: [
                      { $cond: [{ $ifNull: ["$first_name", false] }, 1, 0] },
                      { $cond: [{ $ifNull: ["$last_name", false] }, 1, 0] },
                      {
                        $cond: {
                          if: {
                            $or: [
                              { $ne: ["$gender", null] },
                              { $eq: ["$gender", 0] },
                            ],
                          },
                          then: 1,
                          else: 0,
                        },
                      },
                      {
                        $cond: [
                          {
                            $gt: [{ $size: { $ifNull: ["$interest", []] } }, 0],
                          },
                          1,
                          0,
                        ],
                      },
                      { $cond: [{ $ifNull: ["$work", false] }, 1, 0] },
                      // { $cond: [{ $ifNull: ["$address", false] }, 1, 0] },
                      {
                        $cond: [
                          {
                            $gt: [
                              { $size: { $ifNull: ["$age_range", []] } },
                              0,
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                      {
                        $cond: [
                          { $ifNull: ["$distance_preference", false] },
                          1,
                          0,
                        ],
                      },
                      { $cond: [{ $ifNull: ["$height", false] }, 1, 0] },
                      { $cond: [{ $ifNull: ["$weight.value", false] }, 1, 0] },
                      { $cond: [{ $ifNull: ["$religion", false] }, 1, 0] },
                      { $cond: [{ $ifNull: ["$starSign", false] }, 1, 0] },
                      { $cond: [{ $ifNull: ["$eyeColor", false] }, 1, 0] },
                      { $cond: [{ $ifNull: ["$drink", false] }, 1, 0] },
                      {
                        $cond: [
                          { $ifNull: ["$drinkingSmokingFrequency", false] },
                          1,
                          0,
                        ],
                      },
                      { $cond: [{ $ifNull: ["$preferredPet", false] }, 1, 0] },
                      {
                        $cond: [
                          { $ifNull: ["$relationshipType", false] },
                          1,
                          0,
                        ],
                      },
                      {
                        $cond: [
                          {
                            $gt: [
                              {
                                $size: { $ifNull: ["$traitsAttractedTo", []] },
                              },
                              0,
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                      {
                        $cond: [
                          {
                            $gt: [
                              {
                                $size: { $ifNull: ["$enjoyableActivity", []] },
                              },
                              0,
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                      {
                        $cond: [
                          {
                            $gt: [
                              { $size: { $ifNull: ["$partnerQualities", []] } },
                              0,
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                    ],
                  },
                  19, // Total number of fields checked
                ],
              },
              100,
            ],
          },
        },
      },
    ]);

    const userUage = await calculateUserBenefits(id);
    const setting = await Settings.find({});
    if (getUserDetails) {
      const userDetails = {
        // user,
        // user_images,
        // stories,
        getUserDetails: getUserDetails,
        benift_available: userUage,
        setting,
      };
      return userDetails;
    } else {
      return false;
    }
  } catch (err) {
    console.error("errrrrrrr", err);
    return false;
  }
};

export const generateToken = async (
  payload: object,
  salt: string,
  options: jwt.SignOptions
): Promise<string> => {
  return new Promise((res, rej) => {
    jwt.sign(payload, salt, options, (err, token) => {
      if (err) {
        return rej(err);
      }
      res(token!);
    });
  });
};

export function generateAccessToken(
  user: UserInterface.userTypes | any
): Promise<string> {
  return generateToken({ id: user.id, email: user.email }, jwtSecret, {
    expiresIn: tokenExpiresIn,
  });
}

export const mobileNumberOTP = async (data: userTpes.mobileOtp) => {
  try {
    const mobile_number = data?.mobile;
    if (mobile_number) {
      const currentTime: Date = new Date();
      const existingOTP = await MobileOTP.findOne({
        mobile: mobile_number,
        createdAt: { $gte: new Date(currentTime.valueOf() - 2 * 60 * 1000) }, // used valueof() because left hand operand must be of number, bigint type in typescript
      });
      if (existingOTP) {
        return {
          message:
            "OTP already sent to your mobile number. Try after 2 minutes.",
          status: true,
        };
      } else {
        const currentOtp = await MobileOTP.findOne({
          mobile: mobile_number,
        });
        if (currentOtp) {
          await MobileOTP.deleteOne({ _id: currentOtp._id });
          const otp = 5436;
          const newOTP = new MobileOTP({
            mobile: mobile_number,
            otp: otp,
            age: 30,
          });
          await newOTP.save();
          // SendOtpViaTwilio(mobile_number, otp);
          return {
            message: "OTP sent to mobile number",
            status: true,
          };
        } else {
          const otp = 5436;
          const newOTP = new MobileOTP({
            mobile: mobile_number,
            otp: otp,
            age: 30,
          });
          await newOTP.save();
          // SendOtpViaTwilio(mobile_number, otp);
          return {
            message: "OTP sent to mobile number",
            status: true,
          };
        }
      }
    } else {
      return {
        message: "Please send mobile number",
        status: false,
      };
    }
  } catch (err) {
    console.error("errerr", err);
  }
};

export const SendOtpViaTwilio = async (
  number: number | string,
  otp: number
) => {
  try {
    client.messages
      .create({
        body:
          "Hello from Hotspot Meet. Your OTP for login is " +
          otp +
          ", please do not share this OTP with anyone else.",
        to: number,
        from: process.env.TWILIO_PHONE_NUMBER,
      })
      .then((message: any) => console.log(message.sid))
      .catch((err: any) => console.log("errrr twilio", err));
  } catch (err) {
    console.error("error twilio", err);
  }
};

export const VerifyMobileNumberOtp = async (data: {
  mobile: number | string;
  otp: string | number;
}) => {
  const mobile_number = data?.mobile;
  const OTP = data?.otp;
  if (mobile_number && OTP) {
    const currentTime: Date = new Date();
    const currentOtp = await MobileOTP.findOne({
      mobile: mobile_number,
      createdAt: { $gte: new Date(currentTime.valueOf() - 2 * 60 * 1000) },
    });
    if (currentOtp) {
      if (OTP == currentOtp.otp) {
        const UserExist = await findUserByWhere({
          mobile: mobile_number,
        });
        if (UserExist && UserExist.is_user_active == false) {
          return {
            message:
              "Your account is no longer active. Please contact to Admin",
            status: false,
            userDetails: {
              is_user_active: UserExist?.is_user_active,
              is_deactivated_by_admin: UserExist?.is_deactivated_by_admin,
            },
          };
        } else if (UserExist && UserExist.IsprofileComplete) {
          const token = jwt.sign({ id: UserExist._id }, `${jwtSecret}`, {
            expiresIn: process.env.JWT_EXPIRY_HOURS,
          });
          await redisClient.set(`user_${UserExist._id}`, token);
          const user_all_details: any = await findUserByID(UserExist?._id);
          // Give user a empty string for now until the upload is not completed
          await MobileOTP.deleteOne({
            mobile: mobile_number,
          });
          return {
            message: "User already registered",
            status: true,
            token: token,
            IsprofileComplete: UserExist?.IsprofileComplete,
            user_details: user_all_details,
          };
        } else if (UserExist) {
          const token = jwt.sign({ id: UserExist._id }, `${jwtSecret}`, {
            expiresIn: process.env.JWT_EXPIRY_HOURS,
          });
          await redisClient.set(`user_${UserExist._id}`, token);
          await MobileOTP.deleteOne({
            mobile: mobile_number,
          });
          return {
            message:
              "Mobile number registered successfully, please complete your profile",
            status: true,
            token: token,
            IsprofileComplete: false,
          };
        } else {
          const newUser = new User({
            mobile: mobile_number,
          });
          const newCreatedUser = await newUser.save();
          const token = jwt.sign({ id: newCreatedUser._id }, `${jwtSecret}`, {
            expiresIn: process.env.JWT_EXPIRY_HOURS,
          });
          await redisClient.set(`user_${newCreatedUser._id}`, token);
          await MobileOTP.deleteOne({
            mobile: mobile_number,
          });
          return {
            message:
              "Mobile number registered successfully, please complete your profile",
            status: true,
            token: token,
            IsprofileComplete: false,
          };
        }
      } else {
        return {
          message: "Invalid OTP",
          status: false,
          InvalidOTP: true,
        };
      }
    } else {
      return {
        message: "OTP has expired please send a new OTP",
        status: false,
      };
    }
  } else {
    return {
      message: "Please send mobile number and OTP",
      status: false,
    };
  }
};

export const UpdateUserProfile = async (
  body: UserInterface.userTypes,
  user: { id: number; token: string }
) => {
  const userId = user.id;
  const conditions = {
    _id: userId,
  };
  const update = {
    first_name: body?.first_name,
    last_name: body?.last_name,
    dob: body?.dob,
    bio: body?.bio,
    gender: body?.gender,
    address: body?.address,
  };

  const Updateuser = await User.findOneAndUpdate(conditions, update);
  if (Updateuser) {
    return {
      status: true,
      message: "Profile updated successfully",
    };
  } else {
    return {
      status: false,
      message: "User Not updated",
    };
  }
};

export const GetallSignUpData = async () => {
  const allInterest = await Interests.find({});
  const maximumRadius = await Settings.findOne({ name: "max_radius" });
  const gender = await Gender.find({});
  const occupation = await Occupation.find({});
  const sports = await Sports.find({});
  const data = {
    allInterest: allInterest,
    gender: gender,
    occupation: occupation,
    max_radius: maximumRadius,
    sports: sports,
  };
  return {
    status: true,
    data: data,
  };
};

export const googleLogin = async (token: string) => {
  const idToken: string = token;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: client_id,
    });
    if (ticket) {
      const payload: any = ticket.getPayload();
      if (payload?.email) {
        const UserExist = await findUserByWhere({ email: payload?.email });
        if (
          UserExist &&
          UserExist.IsprofileComplete &&
          UserExist?.is_user_active
        ) {
          const token = jwt.sign({ id: UserExist._id }, `${jwtSecret}`, {
            expiresIn: process.env.JWT_EXPIRY_HOURS,
          });
          await redisClient.set(`user_${UserExist._id}`, token);
          const user_all_details: any = await findUserByID(UserExist?._id);
          return {
            message: "User already registered",
            status: true,
            token: token,
            IsprofileComplete: UserExist?.IsprofileComplete,
            user_details: user_all_details,
          };
        } else if (UserExist && UserExist?.is_user_active) {
          const token = jwt.sign({ id: UserExist._id }, `${jwtSecret}`, {
            expiresIn: process.env.JWT_EXPIRY_HOURS,
          });
          await redisClient.set(`user_${UserExist._id}`, token);
          return {
            message: "Please complete your profile",
            status: true,
            token: token,
            IsprofileComplete: false,
            userDetails: {
              is_user_active: UserExist?.is_user_active,
              is_deactivated_by_admin: UserExist?.is_deactivated_by_admin,
            },
          };
        } else if (UserExist && !UserExist?.is_user_active) {
          return {
            message: "Account deactivated",
            status: false,
            userDetails: {
              is_user_active: UserExist?.is_user_active,
              is_deactivated_by_admin: UserExist?.is_deactivated_by_admin,
            },
          };
        } else {
          const newUser = new User({
            email: payload?.email,
            signup_type: {
              social_name: "Google",
            },
          });
          const newCreatedUser = await newUser.save();
          const token = jwt.sign({ id: newCreatedUser._id }, `${jwtSecret}`, {
            expiresIn: process.env.JWT_EXPIRY_HOURS,
          });
          await redisClient.set(`user_${newCreatedUser._id}`, token);
          await newUser.save();
          return {
            message: "User email registered, please complete user profile",
            status: true,
            token: token,
            IsprofileComplete: false,
          };
        }
      } else {
        return {
          status: false,
          message:
            "User cannot be verified/ Token invalid please try again later",
        };
      }
    } else {
      return {
        message: "Token expired or invalid",
        status: true,
      };
    }
  } catch (error) {
    console.error("errorerror", error);
    return false;
  }
};

export const facebookLogin = async (
  req: UserInterface.CustomRequest,
  res: Response
) => {
  //service to perform fb login
  const { accessToken } = req.body;

  try {
    const response = await fetch(
      `${process.env.FACEBOOK_GRAPH_URL}/me?access_token=${accessToken}`
    );
    const data = await response.json();

    if (data?.id && data?.email) {
      let userData = {
        id: data?.id,
        name: data?.name,
        email: data?.email,
      };
      const UserExist = await findUserByWhere({
        email: data?.email,
        "signup_type.social_name": "Facebook",
        "signup_type.social_data.id": data?.id,
      });

      if (
        UserExist &&
        UserExist.IsprofileComplete &&
        UserExist?.is_user_active
      ) {
        const token = jwt.sign({ id: UserExist._id }, `${jwtSecret}`, {
          expiresIn: process.env.JWT_EXPIRY_HOURS,
        });
        await redisClient.set(`user_${UserExist._id}`, token);
        const user_all_details: any = await findUserByID(UserExist?._id);
        return {
          message: "User already registered",
          status: true,
          token: token,
          IsprofileComplete: UserExist?.IsprofileComplete,
          user_details: user_all_details,
        };
      } else if (UserExist && UserExist?.is_user_active) {
        const token = jwt.sign({ id: UserExist._id }, `${jwtSecret}`, {
          expiresIn: process.env.JWT_EXPIRY_HOURS,
        });
        await redisClient.set(`user_${UserExist._id}`, token);
        return {
          message: "Please complete your profile",
          status: true,
          token: token,
          IsprofileComplete: false,
        };
      } else if (UserExist && !UserExist?.is_user_active) {
        return {
          message: "Account deactivated",
          status: false,
          userDetails: {
            is_user_active: UserExist?.is_user_active,
            is_deactivated_by_admin: UserExist?.is_deactivated_by_admin,
          },
        };
      } else {
        const newUser = new User({
          email: data?.email,
          signup_type: {
            social_name: "Facebook",
            social_data: {
              id: data?.id,
            },
          },
        });
        const newCreatedUser = await newUser.save();
        const token = jwt.sign({ id: newCreatedUser._id }, `${jwtSecret}`, {
          expiresIn: process.env.JWT_EXPIRY_HOURS,
        });
        await redisClient.set(`user_${newCreatedUser._id}`, token);
        await newUser.save();
        return {
          message: "User email registered, please complete user profile",
          status: true,
          token: token,
          IsprofileComplete: false,
        };
      }
      // const userRecord = await admin.auth().getUser(userId);

      // return userRecord.toJSON();
    } else {
      return {
        status: false,
        message: "Cannot authorize account",
      };
    }
  } catch (error) {
    return false;
  }
};

export const appleLogin = async (token: string) => {
  // service to perform apple login
  const idToken = token;

  try {
    const decodedToken = jwt.decode(idToken, { complete: true });

    if (!decodedToken || !decodedToken.header || !decodedToken.header.kid) {
      return {
        status: false,
        message: "Unauthorized",
      };
    }

    const applePublicKeys: any = await axios.get(
      "https://appleid.apple.com/auth/keys"
    );

    const applePublicKeyJWK = applePublicKeys.data.keys.find(
      (key: UserInterface.AppleKey) => key.kid === decodedToken?.header.kid
    );
    if (!applePublicKeyJWK) {
      return false;
    }

    const applePublicKeyPEM = jwkToPem(applePublicKeyJWK);
    const decoded: any = jwt.verify(idToken, applePublicKeyPEM);
    if (decoded && decoded.sub && decoded.email) {
      const userAppleId = decoded.sub;
      let UserExist;
      if (decoded.email) {
        UserExist = await User.findOne({
          $or: [
            { email: decoded.email },
            // {
            //   $and: [
            //     { "signup_type.social_name": "Apple" },
            //     { "signup_type.social_data.id": userAppleId },
            //   ],
            // },
          ],
        });
      } else {
        UserExist = await User.findOne({
          $or: [
            // { email: decoded.email },
            {
              $and: [
                { "signup_type.social_name": "Apple" },
                { "signup_type.social_data.id": userAppleId },
              ],
            },
          ],
        });
      }
      if (
        UserExist &&
        UserExist?.IsprofileComplete &&
        UserExist?.is_user_active
      ) {
        const token = jwt.sign({ id: UserExist._id }, `${jwtSecret}`, {
          expiresIn: process.env.JWT_EXPIRY_HOURS,
        });
        await redisClient.set(`user_${UserExist._id}`, token);
        const user_all_details: any = await findUserByID(UserExist?._id);
        return {
          message: "User already registered",
          status: true,
          token: token,
          IsprofileComplete: UserExist?.IsprofileComplete,
          user_details: user_all_details,
        };
      } else if (UserExist && UserExist?.is_user_active) {
        const token = jwt.sign({ id: UserExist._id }, `${jwtSecret}`, {
          expiresIn: process.env.JWT_EXPIRY_HOURS,
        });
        await redisClient.set(`user_${UserExist._id}`, token);
        return {
          message: "Please complete your profile",
          status: true,
          token: token,
          IsprofileComplete: false,
          userDetails: {
            is_user_active: UserExist?.is_user_active,
            is_deactivated_by_admin: UserExist?.is_deactivated_by_admin,
          },
        };
      } else if (UserExist && !UserExist?.is_user_active) {
        return {
          message: "Account deactivated",
          status: false,
          userDetails: {
            is_user_active: UserExist?.is_user_active,
            is_deactivated_by_admin: UserExist?.is_deactivated_by_admin,
          },
        };
      } else {
        const newUser = new User({
          email: decoded.email,
          signup_type: {
            social_name: "Apple",
            social_data: {
              id: userAppleId,
            },
          },
        });
        const newCreatedUser = await newUser.save();
        const token = jwt.sign({ id: newCreatedUser._id }, `${jwtSecret}`, {
          expiresIn: process.env.JWT_EXPIRY_HOURS,
        });
        await redisClient.set(`user_${newCreatedUser._id}`, token);
        await newUser.save();
        return {
          message: "User email registered, please complete user profile",
          status: true,
          token: token,
          IsprofileComplete: false,
        };
      }
    } else {
      return {
        status: false,
        message: "Invalid JWT token",
      };
    }
  } catch (error) {
    console.error("error", error);
    return false;
  }
};

export const getUserWithinRadius = async (user: any) => {
  const { longitude, latitude } = user.location;
  const userLocation = {
    type: "Point",
    coordinates: [parseFloat(longitude), parseFloat(latitude)],
  };

  try {
    const nearbyUsers = await User.find({
      location: {
        $near: {
          $geometry: userLocation,
          $maxDistance: 100,
        },
      },
      isOnline: true,
    });

    return nearbyUsers;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const updateUserLocation = async (data: any) => {
  try {
    const user = data?.user;
    const coordinates = data?.coordinates;
    user.location = {
      type: "Point",
      coordinates: coordinates,
    };
    // await User.save();
    return user;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const SwipeUser = async (
  data: UserInterface.Swiper,
  user_id: string
) => {
  try {
    const { swipeeUserId, swipeDirection } = data;
    const swiperUserId = user_id;
    // Just in case to handle postman call a check for if the user has already swiped
    // but in application this condition is not needed as the user will get only those other users
    // whom he has not signed up yet
    const existingSwipe = await Swipe.findOne({
      swiperUserId,
      swipeeUserId,
    });

    if (existingSwipe) {
      return {
        status: false,
        message: "User has already swiped on this profile.",
      };
    } else {
      const swipe = new Swipe({ swiperUserId, swipeeUserId, swipeDirection });
      const saveSwipe = await swipe.save();

      if (swipeDirection == "right") {
        //   Now Check if its a match or not
        const reverseSwipe = await Swipe.findOne({
          swiperUserId: swipeeUserId,
          swipeeUserId: swiperUserId,
          swipeDirection: "right", // Assuming a match occurs when both users swipe right
        });
        if (reverseSwipe) {
          // It's a match!
          const match = new Match({ users: [swiperUserId, swipeeUserId] });
          await match.save();
          const userFCm = await UserFCM.findOne({
            user_id: new mongoose.Types.ObjectId(swipeeUserId),
          });
          if (userFCm?.fcm_token) {
            // SendPushToUser(
            //   "It's a match",
            //   "You got a new match",
            //   userFCm?.fcm_token
            // );

            let notificationData = {
              title: "It's a match",
              body: "You got a new match",
              userFcmToken: userFCm?.fcm_token,
              data: {
                type: "match",
              },
            };
            addFcmJob(notificationData).then(() => {
              console.log("Notification job added to the queue");
            });
          }
          const SwipeeUserDataId = new mongoose.Types.ObjectId(swipeeUserId);
          const SwipeeUserData = await User.aggregate([
            {
              $match: {
                _id: SwipeeUserDataId,
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
                        ],
                      },
                    },
                  },
                ],
                as: "media",
              },
            },
            {
              $project: {
                _id: 1,
                first_name: 1,
                last_name: 1,
                email: 1,
                media: {
                  $filter: {
                    input: "$media",
                    as: "mediaItem",
                    cond: { $eq: ["$$mediaItem.mediaType", "profile"] },
                  },
                },
              },
            },
          ]);
          // UpdateUserPlanOnUse("swipes", user_id);
          deductBenefit(user_id, "swipes", 1);
          return {
            status: true,
            is_matched: true,
            message: "Its a match",
            SwipeeUserData,
          };
        } else {
          const userFCm = await UserFCM.findOne({
            user_id: new mongoose.Types.ObjectId(swipeeUserId),
          });
          if (userFCm?.fcm_token) {
            let notificationData = {
              title: "Someone swiped right on you",
              body: "Take a look and see who's interested!",
              userFcmToken: userFCm?.fcm_token,
              data: {
                type: "likes",
              },
            };
            addFcmJob(notificationData).then(() => {
              console.log("Notification job added to the queue");
            });
          }
          // UpdateUserPlanOnUse("swipes", user_id);
          deductBenefit(user_id, "swipes", 1);
          return {
            status: true,
            is_matched: false,
            message: "Swipe registered",
          };
        }
      }
      // UpdateUserPlanOnUse("swipes", user_id);
      deductBenefit(user_id, "swipes", 1);
    }
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const GetMySwipesUser = async (
  user_id: string,
  pagevalue: number,
  userlatlon: Array<number>
) => {
  try {
    const userId = user_id;
    const currentUserCoordinates = [30.892862, 75.90897];
    const page = pagevalue || 1;
    const limit = 15;
    const skip = (page - 1) * limit;
    const user_id_mongo = new mongoose.Types.ObjectId(user_id);
    const user_preferences: any = await findUserByWhere({ _id: user_id_mongo });
    const age_range = user_preferences?.age_range
      ? user_preferences?.age_range
      : [18, 100];
    const interested_in = user_preferences?.interested_in
      ? user_preferences?.interested_in
      : 0;
    const coordinates = user_preferences?.location?.coordinates
      ? user_preferences?.location?.coordinates
      : [75.83305999999999, 30.900793333333333];
    const alreadySwipedProfileIds = (
      await Swipe.find({ swiperUserId: userId })
    ).map((swipe) => new mongoose.Types.ObjectId(swipe.swipeeUserId));

    const blockedUserIds = (await Block.find({ blockerUserId: userId })).map(
      (block) => new mongoose.Types.ObjectId(block.blockedUserId)
    );

    const blockerUserIds = (await Block.find({ blockedUserId: userId })).map(
      (block) => new mongoose.Types.ObjectId(block.blockerUserId)
    );

    const eligibleProfiles = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: coordinates,
          },
          distanceField: "distance",
          spherical: true,
          maxDistance: 20000000,
          query: {
            _id: {
              $nin: [
                user_id_mongo,
                ...blockedUserIds,
                ...blockerUserIds,
                ...alreadySwipedProfileIds,
              ],
            },
            dob: {
              $gte: new Date(
                new Date().setFullYear(new Date().getFullYear() - age_range[1])
              ),
              $lte: new Date(
                new Date().setFullYear(new Date().getFullYear() - age_range[0])
              ),
            },
            gender: interested_in,
            IsprofileComplete: true,
            is_user_active: true,
          },
          key: "location",
        },
      },
      {
        $lookup: {
          from: "media",
          //   localField: '_id',
          //   foreignField: 'userId',
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$status", "active"] },
                  ],
                },
              },
            },
          ],
          as: "media",
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    return {
      status: true,
      users: eligibleProfiles,
      message: "User profile remamaing for swipes",
    };
  } catch (err) {
    console.error(err);
    return false;
  }
};

export async function SendPushToUser(
  title: string,
  body: string,
  userFcm: string,
  data?: any,
  image?: any
) {
  const userFcmToken = userFcm;

  if (image != undefined && image != "") {
    var message: any = {
      notification: {
        title: title,
        body: body,
      },
      data: data,
      token: userFcmToken,
      android: {
        notification: {
          imageUrl: image,
        },
      },
      apns: {
        payload: {
          aps: {
            "mutable-content": 1,
          },
        },
        fcm_options: {
          image: image,
        },
      },
    };
  } else {
    var message: any = {
      notification: {
        title: title,
        body: body,
      },
      data: data,
      token: userFcmToken,
    };
  }
  // Compose the notification message

  // Send the notification
  if (admin) {
    admin
      ?.messaging()
      .send(message)
      .then((response: any) => {})
      .catch((error: any) => {
        console.error("Error sending message:", error);
      });
  }
}

export const updateUserDataInDatabase = async (user_id: any, changes: any) => {
  try {
    const findUser = await User.findOneAndUpdate({ _id: user_id }, changes);
    if (findUser) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.error("updateUserDataInDatabaseerrrr---->", err);
    return false;
  }
};

export const GetUserWhoLikedMe = async (
  user_id: string,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const userId = new mongoose.Types.ObjectId(user_id);
    const skip = (page - 1) * limit;
    const totalCount = await Swipe.countDocuments({
      swipeeUserId: userId,
      swipeDirection: "right",
    });
    const blockedUserIds = (await Block.find({ blockerUserId: userId })).map(
      (block) => new mongoose.Types.ObjectId(block?.blockedUserId)
    );

    const blockerUserIds = (await Block.find({ blockedUserId: userId })).map(
      (block) => new mongoose.Types.ObjectId(block.blockerUserId)
    );

    const results = await Swipe.aggregate([
      {
        $match: {
          $and: [
            {
              swiperUserId: {
                $nin: [...blockedUserIds, ...blockerUserIds],
              },
            },
            {
              swipeeUserId: {
                $nin: [...blockedUserIds, ...blockerUserIds],
              },
            },
            { swipeeUserId: userId },
            { swipeDirection: "right" },
          ],
        },
      },
      {
        $sort: {
          timestamp: -1,
        },
      },
      {
        $lookup: {
          from: "swipes",
          localField: "swiperUserId",
          foreignField: "swipeeUserId",
          as: "mySwipes",
        },
      },
      {
        $match: {
          "mySwipes.swiperUserId": { $ne: userId }, // Ensure not to include users you've swiped
        },
      },
      {
        $lookup: {
          from: "users",
          let: { userId: "$swiperUserId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_id", "$$userId"] },
                    { $eq: ["$is_user_active", true] },
                  ],
                },
              },
            },
          ],
          as: "matchedUsers",
        },
      },
      {
        $unwind: "$matchedUsers",
      },
      {
        $lookup: {
          from: "media",
          let: { userId: "$swiperUserId" },
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
        $project: {
          _id: "$matchedUsers._id",
          first_name: "$matchedUsers.first_name",
          last_name: "$matchedUsers.last_name",
          dob: "$matchedUsers.dob",
          media: 1,
          // Include other fields you need
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      status: true,
      users: results,
      currentPage: page,
      limit,
      totalPages,
    };
  } catch (err) {
    console.error("errerr", err);
    return false;
  }
};

export const getAllNearByUserAccordingPreference = async (
  user_id: string,
  location?: Array<number>
) => {
  try {
    const user_id_mongo = new mongoose.Types.ObjectId(user_id);
    const user_preferences: any = await findUserByWhere({ _id: user_id_mongo });
    const age_range = user_preferences?.age_range
      ? user_preferences?.age_range
      : [18, 100];
    const interested_in = user_preferences?.interested_in
      ? user_preferences?.interested_in
      : 0;
    const coordinates = location
      ? location
      : user_preferences?.location?.coordinates;
    const distance_preference = user_preferences?.distance_preference
      ? user_preferences?.distance_preference
      : 3;
    const blockedUserIds = (
      await Block.find({ blockerUserId: user_id_mongo })
    ).map((block) => new mongoose.Types.ObjectId(block.blockedUserId));

    const blockerUserIds = (
      await Block.find({ blockedUserId: user_id_mongo })
    ).map((block) => new mongoose.Types.ObjectId(block.blockerUserId));

    const nearbyUsersWithDistance = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: coordinates,
          },
          distanceField: "distance",
          spherical: true,
          maxDistance: distance_preference * 1000,
          query: {
            _id: {
              $nin: [user_id_mongo, ...blockedUserIds, ...blockerUserIds],
            },
            dob: {
              $gte: new Date(
                new Date().setFullYear(new Date().getFullYear() - age_range[1])
              ),
              $lte: new Date(
                new Date().setFullYear(new Date().getFullYear() - age_range[0])
              ),
            },
            gender: interested_in,
            IsprofileComplete: true,
            is_user_active: true,
            isOnline: false,
          },
          key: "location",
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
          from: "stories",
          let: { userId: "$_id", viewUserID: user_id_mongo },
          pipeline: [
            { $match: { $expr: { $eq: ["$user_id", "$$userId"] } } },
            {
              $addFields: {
                isSeen: {
                  $in: [
                    "$$viewUserID",
                    {
                      $map: {
                        input: "$views",
                        as: "view",
                        in: "$$view.user_id",
                      },
                    },
                  ],
                },
              },
            },
            { $project: { _id: 1, isSeen: 1 } },
          ],
          as: "stories",
        },
      },
    ]);
    if (nearbyUsersWithDistance.length) {
      return nearbyUsersWithDistance;
    } else {
      return [];
    }
  } catch (err) {
    return false;
  }
};

export const getSearchedUsers = async (
  body: UserInterface.Searchuser,
  user_id: string
) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(user_id);
    const searchValue = body?.searchValue;
    const page = body?.page;
    const pageSize = body?.pageSize || 10;
    // const user_preferences: any = await findUserByWhere({ _id: currentUserId });
    const blockedUserIds = (
      await Block.find({ blockerUserId: currentUserId })
    ).map((block) => new mongoose.Types.ObjectId(block?.blockedUserId));

    const blockerUserIds = (
      await Block.find({ blockedUserId: currentUserId })
    ).map((block) => new mongoose.Types.ObjectId(block.blockerUserId));
    const findUser = await User.aggregate([
      // {
      //   $addFields: {
      //     // Create a full_name field by concatenating first_name and last_name
      //     full_name: { $concat: ["$first_name", " ", "$last_name"] },
      //   },
      // },
      // {
      //   $geoNear: {
      //     near: {
      //       type: "Point",
      //       coordinates: user_preferences?.location.coordinates,
      //     },
      //     distanceField: "distance",
      //     spherical: true,
      //     maxDistance: 20000000,
      //     query: {
      //       $or: [
      //         { first_name: { $regex: new RegExp(searchValue, "i") } }, // 'i' for case-insensitive
      //         { last_name: { $regex: new RegExp(searchValue, "i") } },
      //         { full_name: { $regex: new RegExp(searchValue, "i") } },
      //       ],
      //       _id: {
      //         $nin: [currentUserId, ...blockedUserIds, ...blockerUserIds],
      //       },

      //       IsprofileComplete: true,
      //       is_user_active: true,
      //     },
      //     key: "location",
      //   },
      // },
      {
        $addFields: {
          full_name: { $concat: ["$first_name", " ", "$last_name"] },
        },
      },
      {
        $match: {
          $and: [
            {
              $or: [
                { first_name: { $regex: searchValue, $options: "i" } },
                { last_name: { $regex: searchValue, $options: "i" } },
                { full_name: { $regex: searchValue, $options: "i" } },
              ],
            },
            {
              _id: {
                $nin: [currentUserId, ...blockedUserIds, ...blockerUserIds],
              },
            },
            { IsprofileComplete: true },
            { is_user_active: true },
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
                  ],
                },
              },
            },
          ],
          as: "media",
        },
      },
    ])
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    // const TotalNumebrOFUser = await User.countDocuments({
    //   $geoNear: {
    //     near: {
    //       type: "Point",
    //       coordinates: user_preferences?.location.coordinates,
    //     },
    //     distanceField: "distance",
    //     spherical: true,
    //     maxDistance: 20000000,
    //     query: {
    //       $or: [
    //         { first_name: { $regex: new RegExp(searchValue, "i") } }, // 'i' for case-insensitive
    //         { last_name: { $regex: new RegExp(searchValue, "i") } },
    //       ],
    //       _id: {
    //         $nin: [currentUserId, ...blockedUserIds, ...blockerUserIds],
    //       },

    //       IsprofileComplete: true,
    //       is_user_active: true,
    //     },
    //     key: "location",
    //   },
    // });
    if (findUser) {
      return {
        users: findUser,
        // TotalNumebrOFUser,
        status: true,
        message: "Users found",
      };
    } else {
      return {
        users: [],
        status: true,
        message: "No users found",
      };
    }
  } catch (err) {
    console.error(err);
    return {
      status: false,
      message: "Something went wrong",
    };
  }
};

export const deleteUserProfile = async (user_id: string) => {
  try {
    const userId = new mongoose.Types.ObjectId(user_id);
    const user_details = await User.findOneAndUpdate(
      { _id: userId },
      { is_user_active: false, isOnline: false },
      {
        new: true,
      }
    );
    await UserFCM.deleteMany({ user_id: userId });

    await redisClient.set(
      `userStatus:${user_id}`,
      JSON.stringify({ currentChat: null, online: false })
    );
    if (user_details?.stripe_customer_id) {
      await deleteUserSubAndAddons(user_id, user_details?.stripe_customer_id);
    }
    return {
      status: true,
      message: "Account deleted",
    };
  } catch (err) {
    console.error("err", err);
    return {
      status: true,
      message: "Cannot delete account try again later",
    };
  }
};

export const blockReportUser = async (body: any, user_id: string) => {
  try {
    const is_user_report = body?.is_user_report;
    const report_message = body?.report_message;
    const reported_user_id = new mongoose.Types.ObjectId(body.reported_user_id);
    const current_user_id = new mongoose.Types.ObjectId(user_id);
    const checkIfAlreadyExist = await Block.findOne({
      reporterUserId: current_user_id,
      reportedUserId: reported_user_id,
    });
    if (checkIfAlreadyExist) {
      return {
        status: true,
        message: "User already blocked",
      };
    } else {
      if (is_user_report && reported_user_id) {
        const Reportuser = new Report({
          reporterUserId: current_user_id,
          reportedUserId: reported_user_id,
          message: report_message,
        });
        await Reportuser.save();
      }
      const blockUser = new Block({
        blockerUserId: current_user_id,
        blockedUserId: reported_user_id,
      });
      await blockUser.save();
      if (blockUser) {
        return {
          status: true,
          message: "User blocked Successfully",
        };
      } else {
        return {
          status: false,
          message: "Cannot block user please try again later",
        };
      }
    }
  } catch (err) {
    console.error("blockUserblockUserErr--->>>", err);
    return {
      status: false,
      message: "Something went wrong",
    };
  }
};

export const MakeChat = async (body: any, user_id: string) => {
  try {
    const userId = new mongoose.Types.ObjectId(user_id);
    const chatHistoryWithMessages = await Chat.aggregate([
      {
        $match: {
          participants: {
            $elemMatch: {
              $eq: userId,
            },
          },
          // IsChatDeleted: { $ne: userId },
        },
      },
      {
        $lookup: {
          from: "users", // The name of the users collection
          localField: "participants",
          foreignField: "_id",
          as: "participantsDetails",
        },
      },
      {
        $unwind: "$participantsDetails",
      },
      {
        $match: {
          "participantsDetails._id": {
            $ne: new mongoose.Types.ObjectId(userId),
          },
        },
      },
      {
        $lookup: {
          from: "messages", // The name of the messages collection
          let: {
            conversationId: "$_id",
            deletedAt: {
              $ifNull: [
                {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$IsChatDeleted",
                        as: "chatDelete",
                        cond: { $eq: ["$$chatDelete.userId", userId] },
                      },
                    },
                    0,
                  ],
                },
                null,
              ],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$conversationId", "$$conversationId"] },
                    {
                      $gt: [
                        "$timestamp",
                        { $ifNull: ["$$deletedAt.deletedAt", new Date(0)] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $sort: {
                timestamp: -1,
              },
            },
            {
              $limit: 20,
            },
          ],
          as: "recentMessages",
        },
      },
      {
        $addFields: {
          latestMessageTimestamp: { $max: "$recentMessages.timestamp" },
        },
      },
      {
        $sort: {
          latestMessageTimestamp: -1,
        },
      },
      {
        $lookup: {
          from: "messages",
          let: {
            conversationId: "$_id",
            deletedAt: {
              $ifNull: [
                {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$IsChatDeleted",
                        as: "chatDelete",
                        cond: { $eq: ["$$chatDelete.userId", userId] },
                      },
                    },
                    0,
                  ],
                },
                null,
              ],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$conversationId", "$$conversationId"] },
                    { $in: ["$message_state", ["delivered", "sent"]] },
                    { $eq: ["$receiver_id", userId] },
                    {
                      $gt: [
                        "$timestamp",
                        { $ifNull: ["$$deletedAt.deletedAt", new Date(0)] },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $count: "deliveredMessagesCount",
            },
          ],
          as: "deliveredMessagesInfo",
        },
      },
      {
        $addFields: {
          deliveredMessagesCount: {
            $ifNull: [
              {
                $arrayElemAt: [
                  "$deliveredMessagesInfo.deliveredMessagesCount",
                  0,
                ],
              },
              0,
            ],
          },
        },
      },
      {
        $lookup: {
          from: "media",
          let: { userId: "$participantsDetails._id" },
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
          from: "blocks", // Use the correct collection name for blocks
          let: { userId: userId, participantId: "$participantsDetails._id" },
          pipeline: [
            {
              $match: {
                $or: [
                  {
                    $expr: {
                      $and: [
                        { $eq: ["$blockerUserId", "$$userId"] },
                        { $eq: ["$blockedUserId", "$$participantId"] },
                      ],
                    },
                  },
                  {
                    $expr: {
                      $and: [
                        { $eq: ["$blockerUserId", "$$participantId"] },
                        { $eq: ["$blockedUserId", "$$userId"] },
                      ],
                    },
                  },
                ],
              },
            },
          ],
          as: "blockInfo",
        },
      },
      {
        $addFields: {
          isUserBlocked: {
            $cond: {
              if: { $gt: [{ $size: "$blockInfo" }, 0] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          participants: 1,
          requestStatus: 1,
          initiator: 1,
          responder: 1,
          user: {
            _id: "$participantsDetails._id",
            first_name: "$participantsDetails.first_name",
            last_name: "$participantsDetails.last_name",
            isOnline: "$participantsDetails.isOnline",
            is_user_active: "$participantsDetails.is_user_active",
          },
          media: "$media",
          messages: "$recentMessages",
          deliveredMessagesCount: 1,
          deletedAt: 1,
          userDeletedAt: 1,
          isUserBlocked: 1,
          blockInfo: 1,
          isSuggestionActive: 1,
        },
      },
      {
        $match: {
          $and: [
            { initiator: { $exists: true } }, // Ensures initiator exists
            { responder: { $exists: true } }, // Ensures responder exists
          ],
        },
      },
    ]);

    return {
      status: true,
      chats: chatHistoryWithMessages,
    };
  } catch (err) {
    console.error("chatHistoryWithMessages errr---->", err);
    return {
      status: false,
      message: "Some message",
    };
  }
};

export const ViewUserStory = async (body: any, user_id: string) => {
  try {
    const userId = new mongoose.Types.ObjectId(user_id);
    const story_id = new mongoose.Types.ObjectId(body?.story_id);

    const story = await Story.aggregate([
      { $match: { _id: story_id } },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "story_id",
          as: "comments",
        },
      },
      { $unwind: { path: "$views", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "views.user_id",
          foreignField: "_id",
          as: "viewedUser",
        },
      },
      {
        $lookup: {
          from: "media",
          localField: "views.user_id",
          foreignField: "userId",
          as: "viewedUserMedia",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "comments.user_id",
          foreignField: "_id",
          as: "commentUsers",
        },
      },
      {
        $lookup: {
          from: "media",
          localField: "comments.user_id",
          foreignField: "userId",
          as: "commentUserMedia",
        },
      },
      {
        $group: {
          _id: "$_id",
          root: { $first: "$$ROOT" },
          views: {
            $push: {
              $cond: [
                { $eq: ["$views", undefined] },
                "$$REMOVE",
                {
                  view_info: "$views",
                  user_details: {
                    $ifNull: [{ $arrayElemAt: ["$viewedUser", 0] }, {}],
                  },
                  profile_picture: {
                    $ifNull: [{ $arrayElemAt: ["$viewedUserMedia", 0] }, {}],
                  },
                },
              ],
            },
          },
          comments: { $first: "$comments" },
        },
      },
      { $unwind: { path: "$comments", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "comments.user_id",
          foreignField: "_id",
          as: "commentUser",
        },
      },
      {
        $lookup: {
          from: "media",
          localField: "comments.user_id",
          foreignField: "userId",
          as: "commentMedia",
        },
      },
      {
        $group: {
          _id: "$_id",
          root: { $first: "$root" },
          views: { $first: "$views" },
          comments: {
            $push: {
              $cond: [
                { $eq: ["$comments", undefined] },
                "$$REMOVE",
                {
                  comment_info: "$comments",
                  user_details: {
                    $ifNull: [{ $arrayElemAt: ["$commentUser", 0] }, {}],
                  },
                  profile_picture: {
                    $ifNull: [{ $arrayElemAt: ["$commentMedia", 0] }, {}],
                  },
                },
              ],
            },
          },
        },
      },
      {
        $addFields: {
          "root.views": {
            $filter: {
              input: "$views",
              as: "view",
              cond: {
                $or: [
                  { $ne: ["$$view.user_details", {}] },
                  { $ne: ["$$view.profile_picture", {}] },
                ],
              },
            },
          },
          "root.comments": {
            $filter: {
              input: "$comments",
              as: "comment",
              cond: {
                $or: [
                  { $ne: ["$$comment.user_details", {}] },
                  { $ne: ["$$comment.profile_picture", {}] },
                ],
              },
            },
          },
        },
      },
      {
        $replaceRoot: { newRoot: "$root" },
      },
      {
        $addFields: {
          isOwner: { $eq: ["$user_id", userId] },
        },
      },
      {
        $project: {
          mediaUrl: 1,
          isOwner: 1,
          caption: 1,
          text_story_properties: 1,
          type: 1,
          comments: 1,
          views: 1,
        },
      },
    ]);
    if (story.length) {
      if (story[0].isOwner) {
        return {
          message: "Story fetched",
          status: true,
          story: {
            mediaUrl: story[0]?.mediaUrl,
            type: story[0]?.type,
            text_story_properties: story[0]?.text_story_properties,
            comments: story[0]?.comments,
            caption: story[0]?.caption,
            isOwner: story[0]?.isOwner,
            view: story[0]?.views,
          },
        };
      }
      let hasViewed = false;
      if (story[0].views.length) {
        hasViewed = story[0]?.views?.some(
          (view: any) => view?.view_info?.user_id.equals(userId)
        );
      }

      if (hasViewed) {
        return {
          message: "Story already viewed",
          status: true,
          story: {
            type: story[0]?.type,
            text_story_properties: story[0]?.text_story_properties,
            mediaUrl: story[0]?.mediaUrl,
            comments: story[0]?.comments,
            caption: story[0]?.caption,
            isOwner: false,
          },
        };
      }

      await Story.updateOne(
        { _id: story_id },
        {
          $push: {
            views: { user_id: userId, viewed_at: new Date() },
          },
        }
      );

      return {
        message: "Story viewed",
        status: true,
        story: {
          type: story[0]?.type,
          text_story_properties: story[0]?.text_story_properties,
          mediaUrl: story[0]?.mediaUrl,
          comments: story[0]?.comments,
          caption: story[0]?.caption,
          isOwner: false,
          story: story,
        },
      };
    } else {
      return { message: "Story not found", status: false };
    }
  } catch (err) {
    console.error("ViewUserStory Err---->", err);
    return {
      status: false,
      message: "Something went wrong please try later",
    };
  }
};

export const CommentOnStory = async (body: any, userId: string) => {
  try {
    const comment = body?.comment;
    const user_id = new mongoose.Types.ObjectId(userId);
    const story_id = new mongoose.Types.ObjectId(body?.story_id);
    // const user_name = body?.user_name;
    const story = await Story.findById(story_id);
    if (story) {
      const newComment = new Comment({
        user_id,
        story_id,
        comment,
        commented_at: new Date(),
      });
      await newComment.save();
      return { message: "Comment added", status: true };
    } else {
      return { message: "Story does not exist anymore", status: true };
    }
  } catch (err) {
    console.error("CommentOnStory Err---->", err);
    return {
      status: false,
      message: "Something went wrong please try later",
    };
  }
};

export const DeleteUserStory = async (body: any, userId: string) => {
  try {
    const story_id = new mongoose.Types.ObjectId(body?.story_id);
    const user_id = new mongoose.Types.ObjectId(userId);
    const story = await Story.findById(story_id);
    if (story && story?.user_id.equals(user_id)) {
      await story.deleteOne();
      return {
        status: true,
        message: "Story deleted successfully",
      };
    } else {
      return {
        status: false,
        message: "Story not found or unauthorized access",
      };
    }
  } catch (err) {
    console.error("DeleteUserStory Err---->", err);
    return {
      status: false,
      message: "Something went wrong please try later",
    };
  }
};

export const UploadTextStory = async (body: any, userId: string) => {
  try {
    const user_id = new mongoose.Types.ObjectId(userId);
    const text_story_properties = body?.text_story_properties;
    if (text_story_properties) {
      const story = new Story({
        user_id: user_id,
        type: "text",
        text_story_properties: text_story_properties,
      });
      const UploasdStory = await story.save();
      if (UploasdStory) {
        return {
          status: true,
          message: "Story uploaded",
        };
      } else {
        return {
          status: false,
          message: "Story not Uploaded",
        };
      }
    }
  } catch (err) {
    console.error("DeleteUserStory Err---->", err);
    return {
      status: false,
      message: "Something went wrong please try later",
    };
  }
};

export const SetUserStatus = async (
  data: UserInterface.SetUserStatus,
  userId: string
) => {
  try {
    const user_id = new mongoose.Types.ObjectId(userId);
    const user_status = data?.online_status;
    const upUserLoc = await updateUserDataInDatabase(user_id, {
      isOnline: user_status == "online" ? true : false,
    });
    if (upUserLoc) {
      return {
        status: true,
        message: "Status changed",
      };
    } else {
      return {
        status: false,
        message: "Cannot change status",
      };
    }
  } catch (err) {
    console.error("SetUserStatus Err---->", err);
    return {
      status: false,
      message: "Something went wrong please try later",
    };
  }
};

export const SaveUserFcm = async (
  data: UserInterface.StoreUserFcm,
  userId: string
) => {
  try {
    const user_id = new mongoose.Types.ObjectId(userId);
    const user_fcm = data?.fcm;
    const device_id = data?.device_id;

    await UserFCM.deleteMany({ user_id: user_id });
    const findUserFCM = await UserFCM.findOneAndUpdate(
      { device_id: device_id },
      {
        user_id: user_id,
        fcm_token: user_fcm,
      }
    );
    if (findUserFCM) {
      return {
        status: true,
        message: "FCM saved successfully",
      };
    } else {
      const userFCM = new UserFCM({
        user_id: user_id,
        fcm_token: user_fcm,
        device_id: device_id,
      });
      const saveUserFCM = await userFCM.save();
      if (saveUserFCM) {
        return {
          status: true,
          message: "FCM saved successfully",
        };
      } else {
        return {
          status: false,
          message: "FCM saved successfully",
        };
      }
    }
  } catch (err) {
    console.error("SaveUserFcm Err---->", err);
    return {
      status: false,
      message: "Something went wrong please try later",
    };
  }
};

export const GellAllSubscription = async (userId: string) => {
  try {
    const plans: any = await SubscriptionModel.find({
      isActive: true,
      // name: [{ $ne: "free" }],
    });
    const addons: any = await AddOnPurchaseModel.find({
      isActive: true,
      // name: [{ $ne: "free" }],
    });
    return {
      status: true,
      message: "Plans Fetched",
      plans,
      addons,
    };
  } catch (err) {
    console.error("GellAllSubscription Err---->", err);
    return {
      status: false,
      message: "Something went wrong please try later",
    };
  }
};

export const GetUserAllSubscription = async (
  userId: string,
  page = 1,
  size = 10,
  search = ""
) => {
  const subscriptions = await UserSubscription.find({
    user_id: userId,
    plan_name: { $regex: search },
  })
    .limit(size)
    .skip(size * (page - 1));

  const totalCount = await UserSubscription.countDocuments({
    user_id: userId,
    plan_name: { $regex: search },
  });

  const userFreeplan: any = await UserFreePlan.aggregate([
    {
      $match: {
        user_id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "freeplans",
        localField: "freePlanId",
        foreignField: "_id",
        as: "UserFreeplan",
      },
    },
    {
      $project: {
        _id: 1,
        user_id: 1,
        plan_name: 1,
        swipes: 1,
        connects: 1,
        chat: 1,
        video_audio_call: 1,
        renewalDate: 1,
        timestamp: 1,
        freePlanId: 1,
        freePlanDetails: { $arrayElemAt: ["$UserFreeplan", 0] },
      },
    },
  ]);

  let freePlanData = userFreeplan.length ? userFreeplan[0] : {};
  return {
    subscriptions,
    totalCount,
    freePlanData,
  };
};

// export const UpdateUserPlanOnUse = async (
//   feature_type: string,
//   user_id: string
// ) => {
//   try {
//     const user_mongoose_id = new mongoose.Types.ObjectId(user_id);
//     const user_plan = await UserActivePlan.findOne({
//       user_id: user_mongoose_id,
//     });
//     if (feature_type == "swipes") {
//       if (
//         user_plan?.swipes?.type == "custom_swipes" &&
//         user_plan?.swipes?.count > 0
//       ) {
//         user_plan.swipes.count = user_plan?.swipes?.count - 1;
//         await user_plan.save();
//         return {
//           status: true,
//           message: "Swipe Deducted",
//         };
//       } else {
//         return {
//           status: false,
//           message: "Swipe Not Available",
//         };
//       }
//     } else if (feature_type == "connects") {
//       if (
//         user_plan?.connects?.type == "custom_connects" &&
//         user_plan?.connects?.count > 0
//       ) {
//         user_plan.connects.count = user_plan?.connects?.count - 1;
//         await user_plan.save();
//         return {
//           status: true,
//           message: "Connects Deducted",
//         };
//       } else {
//         return {
//           status: false,
//           message: "Connects Not Available",
//         };
//       }
//     } else if (feature_type == "video_audio_call") {
//     }
//   } catch (err) {}
// };

export const logout = async (user_id: string) => {
  try {
    const user_mongoose_id = new mongoose.Types.ObjectId(user_id);

    const remove_user_fcm = await UserFCM.deleteMany({
      user_id: user_mongoose_id,
    });
    const user_soket_id = await getUserSocketId(user_id);
    await sendOfflineEvent(user_id, user_soket_id);
    await removeToken(user_id);
    return {
      status: true,
      message: "User logged out",
    };
  } catch (err) {
    return {
      status: true,
      message: "User logged out",
      error: err,
    };
  }
};

export const getcompleteProfileData = async () => {
  try {
    const data = await CompleteProfile.find();
    return {
      status: true,
      message: "Data fetched",
      data: data,
    };
  } catch (err) {
    console.error("logout err", err);
    return {
      status: true,
      message: "Error while getting data",
      error: err,
    };
  }
};

export const CompleteUserProfileService = async (
  user_id: string,
  data: any
) => {
  try {
    // const mongoose_user_id = new mongoose.Types.ObjectId(user_id);
    const update_user = await User.findByIdAndUpdate(user_id, data);
    if (update_user) {
      return {
        status: true,
        message: "Preferences updated",
      };
    } else {
      return {
        status: true,
        message: "Preferences not updated. Please try again later",
      };
    }
  } catch (err) {
    console.error("logout err", err);
    return {
      status: false,
      message: "Error while getting data",
      error: err,
    };
  }
};

export const GetMyMatches = async (
  user_id: string,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const userId = new mongoose.Types.ObjectId(user_id);
    const skip = (page - 1) * limit;
    const totalMatches = await Match.countDocuments({ users: userId });
    const blockedUserIds = (await Block.find({ blockerUserId: userId })).map(
      (block) => new mongoose.Types.ObjectId(block?.blockedUserId)
    );

    const blockerUserIds = (await Block.find({ blockedUserId: userId })).map(
      (block) => new mongoose.Types.ObjectId(block.blockerUserId)
    );

    const matches = await Match.aggregate([
      {
        $match: {
          $and: [
            { users: userId },
            {
              users: {
                $nin: [...blockedUserIds, ...blockerUserIds],
              },
            },
          ],
        },
      },
      { $unwind: "$users" },
      { $match: { users: { $ne: userId } } },
      {
        $sort: {
          timestamp: -1,
        },
      },
      {
        $lookup: {
          from: "users",
          // localField: "users",
          // foreignField: "_id",
          let: { userId: "$users" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_id", "$$userId"] },
                    { $eq: ["$is_user_active", true] },
                  ],
                },
              },
            },
          ],
          as: "matchedUserDetails",
        },
      },
      {
        $unwind: "$matchedUserDetails",
      },
      {
        $replaceRoot: { newRoot: "$matchedUserDetails" },
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
        $project: {
          first_name: 1,
          last_name: 1,
          dob: 1,
          gender: 1,
          work: 1,
          sports: 1,
          media: 1,
        }, // Exclude sensitive fields
      },
      { $skip: skip },
      { $limit: limit },
    ]);
    const totalPages = Math.ceil(totalMatches / limit);
    return {
      matches,
      status: true,
      currentPage: page,
      limit,
      totalPages,
    };
  } catch (err) {
    console.error("logout err", err);
    return {
      status: false,
      message: "Error while getting data",
      error: err,
    };
  }
};

export const DeleteChats = async (user_id: string, body: any) => {
  try {
    // const deleteChats
    // console.log("chatObjectIdArray", body.chatIds);
    // const chatObjectIdArray = body.chatIds.map(
    //   (id: string) => new mongoose.Types.ObjectId(id)
    // );
    // const userObjectId = new mongoose.Types.ObjectId(user_id);
    // await Chat.updateMany(
    //   { _id: { $in: chatObjectIdArray } },
    //   {
    //     $set: {
    //       "IsChatDeleted.$[elem].deletedAt": new Date(),
    //     },
    //     $addToSet: {
    //       IsChatDeleted: {
    //         $each: [{ userId: userObjectId, deletedAt: new Date() }],
    //         $position: 0,
    //       },
    //     },
    //   },
    //   {
    //     arrayFilters: [{ "elem.userId": userObjectId }],
    //     multi: true,
    //   }
    // );
    const chatObjectIdArray = body.chatIds.map(
      (id: string) => new mongoose.Types.ObjectId(id)
    );
    const userObjectId = new mongoose.Types.ObjectId(user_id);

    const bulkOps: any = [];

    chatObjectIdArray.forEach((chatId: mongoose.Types.ObjectId) => {
      // Operation to update existing entries
      bulkOps.push({
        updateOne: {
          filter: { _id: chatId, "IsChatDeleted.userId": userObjectId },
          update: {
            $set: { "IsChatDeleted.$.deletedAt": new Date() },
          },
        },
      });

      // Operation to add new entry if userId does not exist in IsChatDeleted
      bulkOps.push({
        updateOne: {
          filter: {
            _id: chatId,
            "IsChatDeleted.userId": { $ne: userObjectId },
          },
          update: {
            $push: {
              IsChatDeleted: { userId: userObjectId, deletedAt: new Date() },
            },
          },
        },
      });
    });

    await Chat.bulkWrite(bulkOps);

    return { status: true, message: "Chats updated successfully." };
  } catch (err) {
    console.error("logout err", err);
    return {
      status: false,
      message: "Error while getting data",
      error: err,
    };
  }
};

export const SendNotification = async (user_id: string) => {
  try {
    // const deleteChats = await Chat.updateMany({});
    const userFCm = await UserFCM.findOne({
      user_id: new mongoose.Types.ObjectId(user_id),
    });
    if (userFCm?.fcm_token) {
      let notificationData = {
        title: "Hello, Deependra!",
        body: "Here is your notification message.",
        userFcmToken: userFCm?.fcm_token,
        data: {
          type: "match",
        },
      };

      addFcmJob(notificationData).then(() => {
        console.log("Notification job added to the queue");
      });
    }
    // if (userFCm?.fcm_token) {
    //   SendPushToUser(
    //     "It's a match",
    //     "You got a new match",
    //     userFCm?.fcm_token,
    //     {
    //       // path: "user/location",
    //       type: "match",
    //     }
    //   );
    // } else {
    //   console.log("No FCM");
    // }
  } catch (err) {
    console.error("logout err", err);
    return {
      status: false,
      message: "Error while getting data",
      error: err,
    };
  }
};

export const BlockedUser = async (user_id: string) => {
  const userId = new mongoose.Types.ObjectId(user_id);
  const blockedUser = await Block.aggregate([
    {
      $match: {
        blockerUserId: userId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "blockedUserId",
        foreignField: "_id",
        as: "user_details",
      },
    },
    {
      $lookup: {
        from: "media",
        let: { userId: "$blockedUserId" },
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
      $project: {
        _id: 1,
        blockerUserId: 1,
        blockedUserId: 1,
        timestamp: 1,
        user_details: {
          _id: { $arrayElemAt: ["$user_details._id", 0] },
          first_name: { $arrayElemAt: ["$user_details.first_name", 0] },
          last_name: { $arrayElemAt: ["$user_details.last_name", 0] },
        },
        media: { $arrayElemAt: ["$media", 0] },
      },
    },
    {
      $sort: {
        timestamp: -1,
      },
    },
  ]);

  return blockedUser;
};

async function removeToken(userId: string) {
  await redisClient.del(`user_${userId}`);
}

export const getUserallPlans = async (user_id: string) => {
  const getUserAllPlan: any = await calculateUserBenefits(user_id);

  if (getUserAllPlan) {
    return {
      benift_available: getUserAllPlan,
      user_id: user_id,
      status: true,
    };
  } else {
    return {
      status: false,
      message: "No active Plan",
    };
  }
};

export const GetUserCallLogs = async (
  user_id: string,
  page: number = 1,
  limit: number = 10
) => {
  const skip = (page - 1) * limit;
  const userId = new mongoose.Types.ObjectId(user_id);
  const totalCount = await CallLogs.countDocuments({
    $or: [{ initiator_id: userId }, { responder_id: userId }],
  });
  const getAllLogs = await CallLogs.aggregate([
    {
      $match: {
        $or: [{ initiator_id: userId }, { responder_id: userId }],
      },
    },
    {
      $lookup: {
        from: "users",
        let: {
          otherUserId: {
            $cond: {
              if: { $eq: ["$initiator_id", userId] },
              then: "$responder_id",
              else: "$initiator_id",
            },
          },
        },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$_id", "$$otherUserId"] },
            },
          },
          {
            $lookup: {
              from: "media",
              let: { userIdForImage: "$$otherUserId" },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$userId", "$$userIdForImage"] },
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
        ],
        as: "otherUserDetails",
      },
    },
    {
      $unwind: "$otherUserDetails",
    },
    {
      $project: {
        _id: 1,
        conversation_id: 1,
        initiator_id: 1,
        responder_id: 1,
        call_type: 1,
        call_status: 1,
        duration: 1,
        timestamp: 1,
        otherUser: {
          _id: "$otherUserDetails._id",
          first_name: "$otherUserDetails.first_name",
          last_name: "$otherUserDetails.last_name",
          media: "$otherUserDetails.media",
          is_user_active: "$otherUserDetails.is_user_active",
        },
      },
    },
    {
      $sort: {
        timestamp: -1,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ]);
  return { getAllLogs, totalCount };
};

async function calculateUserBenefits(userId: string) {
  let benefits = {
    swipes: { type: "custom_swipes", count: 0 },
    connects: { type: "custom_connects", count: 0 },
    video_audio_call: { isAvailable: true, duration: 0 },
    chat: true,
  };

  const subscription = await UserSubscription.findOne({
    user_id: userId,
    SubscriptionIsActive: true,
  });
  if (subscription) {
    // Adjust for 'unlimited' or specific 'count'
    benefits.swipes.type = subscription.swipes.type;
    benefits.swipes.count =
      subscription.swipes.type === "custom_swipes"
        ? subscription.swipes.count
        : 0;
    benefits.connects.type = subscription.connects.type;
    benefits.connects.count =
      subscription.connects.type === "custom_connects"
        ? subscription.connects.count
        : 0;
    benefits.video_audio_call.duration +=
      subscription.video_audio_call.duration || 0;
    benefits.chat = subscription.chat;
    benefits.video_audio_call.isAvailable =
      subscription.video_audio_call.isAvailable;
    const addOns = await UserAddOnModel.find({
      user_id: userId,
      is_active: true,
    });
    addOns.forEach((addOn) => {
      switch (addOn.addon_type) {
        case "swipes":
          if (benefits.swipes.type != "unlimited") {
            benefits.swipes.count += addOn.usage;
            benefits.swipes.type = "custom_swipes";
          }
          break;
        case "connects":
          if (benefits.connects.type != "unlimited") {
            benefits.connects.count += addOn.usage;
            benefits.connects.type = "custom_connects";
          }
          break;

        case "video_audio_call":
          benefits.video_audio_call.duration += addOn.usage;
          benefits.video_audio_call.isAvailable = true;
          break;

        case "chat":
          benefits.chat = true; // Assuming add-on can enable chat
          break;
      }
    });
    // }
  } else {
    // Check for Free Plan
    const freePlan: IFreePlan | null = await UserFreePlan.findOne({
      user_id: userId,
    });

    if (freePlan) {
      benefits.swipes.count += freePlan.swipes || 0;
      benefits.connects.count += freePlan.connects || 0;
      benefits.video_audio_call.duration += freePlan.video_audio_call || 0;
      benefits.video_audio_call.isAvailable = freePlan.video_audio_call
        ? true
        : false;
      benefits.swipes.type = "custom_swipes";
      benefits.connects.type = "custom_connects";
      benefits.chat = freePlan.chat;
      const addOns = await UserAddOnModel.find({
        user_id: userId,
        is_active: true,
      });
      addOns.forEach((addOn) => {
        switch (addOn.addon_type) {
          case "swipes":
            benefits.swipes.count += addOn.usage;

            break;
          case "connects":
            benefits.connects.count += addOn.usage;

            break;

          case "video_audio_call":
            benefits.video_audio_call.duration += addOn.usage;
            benefits.video_audio_call.isAvailable = true;
            break;

          case "chat":
            benefits.chat = true; // Assuming add-on can enable chat
            break;
        }
      });
    } else {
      const addOns = await UserAddOnModel.find({
        user_id: userId,
        is_active: true,
      });
      addOns.forEach((addOn) => {
        switch (addOn.addon_type) {
          case "swipes":
            benefits.swipes.count += addOn.usage;
            benefits.swipes.type = "custom_swipes";

            break;
          case "connects":
            benefits.connects.count += addOn.usage;
            benefits.connects.type = "custom_connects";

            break;
          case "video_audio_call":
            benefits.video_audio_call.duration += addOn.usage;
            benefits.video_audio_call.isAvailable = true;
            break;

          case "chat":
            benefits.chat = true;
            break;
        }
      });
    }
  }

  return benefits;
}

export async function deductBenefit(
  userId: string,
  benefitType: string,
  amount: number
) {
  let deducted = false;

  // Case 2: Check for Subscription Plan first
  const subscription: any = await UserSubscription.findOne({
    user_id: userId,
    SubscriptionIsActive: true,
  });
  if (subscription) {
    // Deduct from Subscription Plan only if benefit is not 'unlimited'
    if (
      ["swipes", "connects"].includes(benefitType) &&
      subscription[benefitType]?.type !== "unlimited"
    ) {
      if (subscription[benefitType]?.count >= amount) {
        subscription[benefitType].count -= amount;
        await subscription.save();
        deducted = true;
      }
    } else if (
      benefitType === "video_audio_call" &&
      subscription?.video_audio_call?.duration + 0.5 > amount
    ) {
      subscription.video_audio_call.duration -= amount;
      await subscription.save();
      deducted = true;
    }
    // If 'unlimited', there's no need to deduct, but we consider it as successfully deducted
    else if (
      ["swipes", "connects"].includes(benefitType) &&
      subscription[benefitType]?.type === "unlimited"
    ) {
      deducted = true;
    }
  }

  // Case 3 & 4: Check for Addons if not deducted
  if (!deducted) {
    const addon = await UserAddOnModel.findOne({
      user_id: userId,
      addon_type: benefitType,
      is_active: true,
      usage: { $gte: amount },
    });
    if (addon) {
      addon.usage -= amount;
      await addon.save();
      deducted = true;
    }
  }

  // Case 1 & 6: Check for Free Plan if not deducted
  if (!deducted) {
    const freePlan: any = await UserFreePlan.findOne({ user_id: userId });
    if (
      freePlan &&
      ["swipes", "connects"].includes(benefitType) &&
      freePlan[benefitType] >= amount
    ) {
      freePlan[benefitType] -= amount;
      await freePlan.save();
      deducted = true;
    } else if (
      freePlan &&
      benefitType === "video_audio_call" &&
      freePlan?.video_audio_call + 0.5 > amount
    ) {
      // Assuming free plan stores video call minutes in `video_audio_call`
      freePlan.video_audio_call -= amount;
      await freePlan.save();
      deducted = true;
    }
  }

  return deducted
    ? { success: true, message: "Benefit deduction successful." }
    : {
        success: false,
        message:
          "Unable to deduct benefits. Insufficient balance across plans or benefit is unlimited.",
      };
}

export async function fetchPreviousMessages(
  conversationId: string,
  lastMessageId: string
) {
  try {
    const messages = await Message.find({
      conversationId: conversationId,
      _id: { $lt: lastMessageId },
    })
      .sort({ _id: -1 })
      .limit(20);

    return messages;
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    throw error;
  }
}

export const CheckBlockedStatus = async (conversation_id: string) => {
  try {
    const conversationId = new mongoose.Types.ObjectId(conversation_id);
    const chat = await Chat.findOne({ _id: conversationId });
    if (chat && chat.participants.length) {
      const blockInfo = await Block.find({
        $or: [
          {
            $expr: {
              $and: [
                { $eq: ["$blockerUserId", chat.participants[0]] },
                { $eq: ["$blockedUserId", chat.participants[1]] },
              ],
            },
          },
          {
            $expr: {
              $and: [
                { $eq: ["$blockerUserId", chat.participants[1]] },
                { $eq: ["$blockedUserId", chat.participants[0]] },
              ],
            },
          },
        ],
      });
      return {
        status: true,
        blockInfo,
        isUserBlocked: blockInfo?.length ? true : false,
      };
    } else {
      return {
        status: false,
        message: "No chat with this conversation id",
      };
    }
  } catch (err) {
    console.error("logout err", err);
    return {
      status: true,
      message: "Error while getting data",
      error: err,
    };
  }
};

export const deleteUserSubAndAddons = async (
  userId: string,
  customer_id: string
) => {
  try {
    const user_id = new mongoose.Types.ObjectId(userId);
    const subscriptions = await stripeApp.subscriptions.list({
      customer: customer_id,
      status: "all", // Fetch all statuses (active, past_due, unpaid, canceled, etc.)
    });
    const cancelPromises = subscriptions.data.map((subscription) =>
      stripeApp.subscriptions.cancel(subscription.id)
    );
    await Promise.all(cancelPromises);
    console.log(
      `All subscriptions for customer ${customer_id} have been set to cancel at the period end and the customer has been deleted.`
    );
    await UserSubscription.deleteMany({ user_id });
    await UserAddOnModel.deleteMany({ user_id });
    return true;
  } catch {
    console.error(
      `Failed to cancel subscriptions for customer ${customer_id}:`
    );
  }
};
