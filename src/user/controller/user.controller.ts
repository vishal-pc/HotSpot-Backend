import { Request, Response } from "express";
import { getErrorMessage } from "../../utils/errors.js";
import * as userServices from "../services/user.service.js";
import { CustomRequest } from "../../middleware/auth.js";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import * as UserInterface from "../user.interface.js";
import axios from "axios";
import User from "../models/user.model.js";
import Block from "../models/block.model.js";
import mongoose from "mongoose";
import redisClient from "../../helper/radis/index.js";
import Chat from "../models/chat.model.js";
import { SendUnblockedEvent } from "../../socket/index.js";
import { CallLog } from "../models/user.validation.js";
import CallLogs from "../models/callLogs.model.js";
import {
  calculateExpiryDate,
  cancelUserSubscription,
  genratePaymentLogs,
} from "../services/payment.services.js";
import { Conversation } from "twilio/lib/twiml/VoiceResponse.js";
import UserSubscription from "../models/userSubscription.model.js";
import AddOnPurchaseModel, { AddonIn } from "../../admin/models/addon.model.js";
import UserAddOnModel from "../models/userAddon.model.js";
import PaymentLogModel from "../models/paymentLogs.model.js";
import SubscriptionModel from "../../admin/models/subscription.models.js";
import UserFreePlan from "../models/userFreePlan.model.js";
// import { CustomRequest } from '../middleware/auth';
export interface IGetUserAuthInfoRequest extends Request {
  user: object; // or any other type
}

export const VerifySocialAuth = async (req: any, res: Response) => {
  try {
    const { loginType } = req.body;
    if (loginType == "Google") {
      try {
        const googleLogin = await userServices.googleLogin(req?.user?.token);
        res.status(200).send(googleLogin);
      } catch (error) {
        return res.status(500).send(getErrorMessage(error));
      }
    } else if (loginType == "Apple") {
      try {
        const appleLogin = await userServices.appleLogin(req?.user?.token);
        res.status(200).send(appleLogin);
      } catch (error) {
        return res.status(500).send(getErrorMessage(error));
      }
    } else if (loginType == "Facebook") {
      //handle facebook login
    } else {
      const findUser = await userServices.findUserByMobile(req?.body?.mobile);
      if (findUser) {
        const getToken = await userServices.generateAccessToken(findUser);
        await redisClient.set(`user_${findUser._id}`, getToken);
        return res.status(200).json({
          status: true,
          message: "Login Successfull",
          token: getToken,
        });
      } else {
        res.status(401).send({ message: "Unauthorized" });
      }
    }
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const registerOne = async (req: any, res: Response) => {
  try {
    const userData: any = await userServices.findUserByID(req?.user?.id);
    if (userData.user && userData.user?.IsprofileComplete == true) {
      return res.status(200).json({
        status: false,
        message: "User Already Registered",
        user_details: userData,
      });
    } else if (userData?.user?.IsprofileComplete == false) {
      const NewuserData = await userServices.register(req?.body, req?.user?.id);
      if (NewuserData.status) {
        return res.status(200).json({
          status: true,
          message: "User registered successfully",
          user_details: {
            user: NewuserData.userDetails,
            user_images: NewuserData.UserImages,
          },
        });
      } else {
        return res.status(200).json({
          status: NewuserData.status,
          message: NewuserData.message,
        });
      }
    } else {
      return res
        .status(400)
        .json({ status: false, message: "Something went wrong" });
    }
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const MobileNumberOTP = async (req: Request, res: Response) => {
  try {
    const foundNumber = await userServices.mobileNumberOTP(req.body);
    res.status(200).send(foundNumber);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const VerifyMobileNumberOtp = async (req: Request, res: Response) => {
  try {
    const result = await userServices.VerifyMobileNumberOtp(req.body);
    res.status(200).send(result);
  } catch (error) {
    console.error("errorerrorerrorerror", error);
    return res.status(500).send(getErrorMessage(error));
  }
};

export const UpdateUserProfile = async (req: any, res: Response) => {
  try {
    (req as CustomRequest).user = req?.user;
    const ProfileCompleted = await userServices.UpdateUserProfile(
      req.body,
      req.user
    );
    res.status(200).send(ProfileCompleted);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const GetallSignUpData = async (req: Request, res: Response) => {
  try {
    const result = await userServices.GetallSignUpData();
    res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const updateUserLocationAndGetNewUsers = async (
  req: Request,
  res: Response
) => {
  try {
    //check user
    const mobile = req.body;
    const user = await userServices.findUserByMobile(mobile);
    if (!user) {
      return res.status(401).json({ msg: "Unauthorized" });
    } else {
      //update
      const updateLocation = await userServices.updateUserLocation(user);
      if (updateLocation) {
        //get users
        const getNewUsers = await userServices.getUserWithinRadius(user);
        return res.status(200).json({
          status: true,
          data: getNewUsers,
          message: "Users Fetched Successfully!",
        });
      } else {
        return res
          .status(400)
          .json({ status: false, msg: "Failed to Update Location" });
      }
    }
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Something Went Wrong!",
    });
  }
};

export const uploadUserPicture = async (
  req: UserInterface.CustomRequest,
  res: Response
) => {
  const user_id = req.user.id;
};

export const SwipeUser = async (req: any, res: Response) => {
  try {
    const result = await userServices.SwipeUser(req.body, req.user.id);
    res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const GetMySwipesUser = async (req: any, res: Response) => {
  try {
    const result = await userServices.GetMySwipesUser(
      req.user.id,
      req.body.page,
      req?.body?.user_latlon
    );
    res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const GetUserProfile = async (req: any, res: Response) => {
  try {
    const userProfile = await userServices.GetUserProfileAllDetails(
      req.user.id
    );
    if (userProfile) {
      res.status(200).send(userProfile);
    } else {
      return res.status(500).send({
        message: "User not found",
        status: false,
      });
    }
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const GetUserProfileById = async (req: any, res: Response) => {
  try {
    const GetUserProfileById = await userServices.findUserByID(req.body.id);
    if (GetUserProfileById) {
      res.status(200).send(GetUserProfileById);
    } else {
      return res.status(500).send({
        message: "User not found",
        status: false,
      });
    }
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const GetUserWhoLikedMe = async (req: any, res: Response) => {
  try {
    const result = await userServices.GetUserWhoLikedMe(req.user.id);
    res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const getSearchedUsers = async (req: any, res: Response) => {
  try {
    const result = await userServices.getSearchedUsers(req.body, req.user.id);
    res.status(200).send(result);
  } catch (error) {
    console.error("error", error);
    return res.status(500).send(getErrorMessage(error));
  }
};

export const deleteUserProfile = async (req: any, res: Response) => {
  try {
    const result = await userServices.deleteUserProfile(req.user.id);
    res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const blockReportUser = async (req: any, res: Response) => {
  try {
    const result = await userServices.blockReportUser(req.body, req.user.id);
    res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const UnblockUser = async (req: any, res: Response) => {
  try {
    const result = await Block.findOne({
      _id: new mongoose.Types.ObjectId(req.body.id),
    });
    if (result) {
      const participants = [result.blockerUserId, result.blockedUserId].sort();
      const existingChat: UserInterface.UserChat | any = await Chat.findOne({
        participants,
      });
      const Unblockuser = await Block.deleteOne({
        _id: new mongoose.Types.ObjectId(req.body.id),
      });
      if (Unblockuser && existingChat && existingChat._id) {
        await SendUnblockedEvent(
          existingChat._id,
          result.blockerUserId,
          result.blockedUserId
        );
      }
    }
    res.status(200).send({
      status: true,
      message: "User unblocked",
    });
  } catch (error) {
    console.error("error", error);
    return res.status(500).send(getErrorMessage(error));
  }
};

export const MakeChat = async (req: any, res: Response) => {
  try {
    const result = await userServices.MakeChat(req.body, req.user.id);
    res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const ViewUserStory = async (req: any, res: Response) => {
  try {
    const result = await userServices.ViewUserStory(req.body, req.user.id);
    res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const CommentOnStory = async (req: any, res: Response) => {
  try {
    const result = await userServices.CommentOnStory(req.body, req.user.id);
    res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const DeleteUserStory = async (req: any, res: Response) => {
  try {
    const result = await userServices.DeleteUserStory(req.body, req.user.id);
    res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const UploadTextStory = async (req: any, res: Response) => {
  try {
    const result = await userServices.UploadTextStory(req.body, req.user.id);
    res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const getnearbyuser = async (req: any, res: Response) => {
  try {
    const result = await userServices.getAllNearByUserAccordingPreference(
      req.user.id
    );
    res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const SetUserStatus = async (req: any, res: Response) => {
  try {
    const result = await userServices.SetUserStatus(req?.body, req?.user?.id);
    res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const SaveUserFcm = async (req: any, res: Response) => {
  try {
    const result = await userServices.SaveUserFcm(req?.body, req?.user?.id);
    res.status(200).send(result);
  } catch (error) {
    return res.status(500).send(getErrorMessage(error));
  }
};

export const GellAllSubscription = async (req: any, res: Response) => {
  try {
    const result = await userServices.GellAllSubscription(req?.user?.id);
    res.status(200).send(result);
  } catch (error) {
    console.error("GellAllSubscription", error);
    return res.status(500).send(getErrorMessage(error));
  }
};

export const logout = async (req: any, res: Response) => {
  try {
    const result = await userServices.logout(req?.user?.id);
    res.status(200).send(result);
  } catch (error) {
    console.error("logout", error);
    return res.status(500).send(getErrorMessage(error));
  }
};

export const getcompleteProfileData = async (req: any, res: Response) => {
  try {
    const result = await userServices.getcompleteProfileData();
    res.status(200).send(result);
  } catch (error) {
    console.error("logout", error);
    return res.status(500).send(getErrorMessage(error));
  }
};

export const CompleteUserProfile = async (req: any, res: Response) => {
  try {
    const result = await userServices.CompleteUserProfileService(
      req?.user?.id,
      req?.body
    );
    res.status(200).send(result);
  } catch (error) {
    console.error("logout", error);
    return res.status(500).send(getErrorMessage(error));
  }
};

export const GetMyMatches = async (req: any, res: Response) => {
  try {
    const result = await userServices.GetMyMatches(req?.user?.id);
    res.status(200).send(result);
  } catch (error) {
    console.error("logout", error);
    return res.status(500).send(getErrorMessage(error));
  }
};

export const DeleteChats = async (req: any, res: Response) => {
  try {
    const result = await userServices.DeleteChats(req?.user?.id, req.body);
    res.status(200).send(result);
  } catch (error) {
    console.error("logout", error);
    return res.status(500).send(getErrorMessage(error));
  }
};

export const SendNotification = async (req: any, res: Response) => {
  try {
    const result = await userServices.SendNotification(req?.user?.id);
    res.status(200).send("result");
  } catch (error) {
    console.error("logout", error);
    return res.status(500).send(getErrorMessage(error));
  }
};

export const UpdateUserSettings = async (req: any, res: Response) => {
  try {
    const update = await User.findOneAndUpdate({ _id: req.user.id }, req.body);
    res.status(200).send({
      status: true,
      message: "Setting Updated Successfully",
    });
  } catch (error) {
    console.error("logout", error);
    return res.status(500).send(getErrorMessage(error));
  }
};

export const blockedUser = async (req: any, res: Response) => {
  try {
    const result = await userServices.BlockedUser(req?.user?.id);
    res.status(200).send({
      status: true,
      message: "Setting Updated Successfully",
      users: result,
    });
  } catch (error) {
    console.error("logout", error);
    return res.status(500).send(getErrorMessage(error));
  }
};

// export const getuserasLocation = async (req: any, res: Response) => {
//   try {
//     const update = await userServices.getAllNearByUserAccordingPreference(
//       req?.user?.id,
//       req?.body?.location
//     );
//     res.status(200).send({
//       status: true,
//       message: "Setting Updated Successfully",
//     });
//   } catch (error) {
//     console.log("logout", error);
//     return res.status(500).send(getErrorMessage(error));
//   }
// };

export const getOtherUserPlanDetails = async (req: any, res: Response) => {
  try {
    const result = await userServices.getUserallPlans(req?.body?.user_id);
    res.status(200).send(result);
  } catch (error) {
    console.error("logout", error);
    return res.status(500).send(getErrorMessage(error));
  }
};

export const registerCallLog = async (req: any, res: Response) => {
  try {
    if (req?.body?.id) {
      const logId = new mongoose.Types.ObjectId(req?.body?.id);
      const updateLog = await CallLogs.findOneAndUpdate(
        {
          _id: logId,
        },
        {
          duration: req.body.duration,
          call_status: req.body.call_status,
        }
      );
      return res.status(200).send({
        status: true,
        message: "Log Updated Successfully",
      });
    } else {
      const conversation_id = new mongoose.Types.ObjectId(
        req?.body?.conversation_id
      );
      const initiator_id = new mongoose.Types.ObjectId(req?.body?.initiator_id);
      const responder_id = new mongoose.Types.ObjectId(req?.body?.responder_id);
      const createNewLog = new CallLogs({
        conversation_id,
        initiator_id,
        responder_id,
        call_status: "Missed",
        call_type: req.body.call_type,
      });
      await createNewLog.save();
      return res.status(200).send({
        logs_id: createNewLog._id,
        status: true,
        message: "Log Created Successfully",
      });
    }
  } catch (error) {
    console.error("logout", error);
    return res.status(500).send(getErrorMessage(error));
  }
};

export const GetUserCallLogs = async (req: any, res: Response) => {
  try {
    const result = await userServices.GetUserCallLogs(
      req?.user?.id,
      req?.body?.page,
      req?.body?.limit
    );
    return res.status(200).send(result);
  } catch (err) {
    console.error("GetUserCallLogs", err);
  }
};

export const deductUserCall = async (req: any, res: Response) => {
  try {
    const conversation_id = req.body.conversation_id;
    const users_info = await Chat.findOne({
      _id: new mongoose.Types.ObjectId(conversation_id),
    });
    const user_a = users_info?.participants[0];
    const user_b = users_info?.participants[1];
    if (user_a && user_b) {
      const deduct_user_a = await userServices.deductBenefit(
        user_a.toString(),
        "video_audio_call",
        0.5
      );
      const deduct_user_b = await userServices.deductBenefit(
        user_b.toString(),
        "video_audio_call",
        0.5
      );
      if (deduct_user_a.success && deduct_user_b.success) {
        return res.status(200).send({
          status: true,
          message: "Users benifits deducted",
        });
      } else {
        return res.status(200).send({
          status: false,
          message: "Cannot deduct usage,a user ran out of benifits",
        });
      }
    } else {
      return res
        .status(200)
        .send({ status: false, message: "User with chat id not found" });
    }
  } catch (err) {
    console.error("GetUserCallLogs", err);
  }
};

// export const renewAllUserPlan = async (req: any, res: Response) => {
//   try {
//     const update = await userServices.ensureActiveSubscriptionForAllUsers()
//     res.status(200).send({
//       status: true,
//       message: "Plans updated",
//     });
//   } catch (error) {
//     console.log("logout", error);
//     return res.status(500).send(getErrorMessage(error));
//   }
// };

export const cancleSubscription = async (req: any, res: Response) => {
  try {
    const update = await cancelUserSubscription(req.body, req.user);
    return res.status(200).send({
      status: true,
      message: "Plans updated",
    });
  } catch (error) {
    console.error("logout", error);
    return res.status(500).send(getErrorMessage(error));
  }
};

export const checkBlockedStatus = async (req: any, res: Response) => {
  try {
    const update = await userServices.CheckBlockedStatus(
      req.body.conversation_id
    );
    return res.status(200).send(update);
  } catch (error) {
    console.error("logout", error);
    return res.status(500).send(getErrorMessage(error));
  }
};

export const checkUserSubsciption = async (req: any, res: Response) => {
  try {
    const userid = new mongoose.Types.ObjectId(req.user.id);

    if (req.body.isaddon) {
      const addonId = req.body.id;
      const addOndetails: AddonIn | null =
        await AddOnPurchaseModel.findById(addonId);
      if (addOndetails) {
        const userAddons = await UserAddOnModel.find({
          is_active: true,
          addon_type: addOndetails.benefits.name,
          user_id: userid,
        });

        if (userAddons && userAddons.length > 0) {
          return res.status(200).send({
            status: false,
            message:
              "Addon for " +
              addOndetails?.benefits?.name +
              " already exists. Cancle it first to buy new one",
          });
        } else {
          return res.status(200).send({
            status: true,
            message: "No such active plan. Buy a new one.",
          });
        }
      } else {
        return res.status(200).send({
          status: false,
          message: "No such plan exist anymore. Please refresh the page",
        });
      }
    } else {
      const FindExistingPlan: any = await UserSubscription.find({
        user_id: userid,
        SubscriptionIsActive: true,
        payment_status: "paid",
      });

      if (
        FindExistingPlan.length &&
        !FindExistingPlan[0]?.cancelled_on_stripe
      ) {
        return res.status(200).send({
          status: false,
          message: "Please cancel current subscription to purchase new plan.",
        });
      } else {
        return res.status(200).send({
          status: true,
          message: "No such active plan. Buy a new one.",
        });
      }
    }
  } catch (error) {
    console.error("logout", error);
    return res.status(200).send(getErrorMessage(error));
  }
};

export const validateapplePurchase = async (req: any, res: Response) => {
  const {
    transactionReceipt,
    transactionId,
    originalTransactionId,
    isaddon,
    id,
  } = req.body;

  const userId = req.user.id;
  if (transactionReceipt) {
    try {
      let response = await axios.post(
        "https://sandbox.itunes.apple.com/verifyReceipt",
        {
          "receipt-data": transactionReceipt,
          password: process.env.APPLE_SHARED_SECRET,
        }
      );
      if (response.data.status === 0) {
        if (isaddon) {
          const addOndetails: AddonIn | null =
            await AddOnPurchaseModel.findById(id);

          if (addOndetails) {
            await UserAddOnModel.deleteMany({
              is_active: true,
              addon_type: addOndetails.benefits.name,
              user_id: new mongoose.Types.ObjectId(userId),
            });

            await UserAddOnModel.create({
              user_id: userId,
              addon_id: addOndetails._id,
              addon_type: addOndetails.benefits.name,
              usage: addOndetails.benefits.value,
              original_addon_details: addOndetails,
              is_active: true,
              payment_done_at: new Date(),
              expires_at: Date.now() + 24 * 60 * 60 * 1000,
            });
            await PaymentLogModel.create({
              user_id: userId,
              transaction_type: "addon",
              plan_id: addOndetails._id.toString(),
              amount: addOndetails.price,
              details: addOndetails.benefits,
              payment_status: "completed",
              payment_completed_at: new Date(),
            });
            return res.status(200).send({
              status: true,
              message: "Plan purchased",
              subscriptionId: addOndetails._id,
            });
          } else {
            return res.status(200).send({
              status: false,
              message: "No such plan exist anymore. Please refresh the page",
            });
          }
        } else {
          const { latest_receipt_info } = response.data;
          const latestReceipt = latest_receipt_info.reduce(
            (latest: any, current: any) => {
              return parseInt(latest.purchase_date_ms, 10) >
                parseInt(current.purchase_date_ms, 10)
                ? latest
                : current;
            }
          );
          const transactionId = latestReceipt.original_transaction_id;
          const existingPlanAndActive = await UserSubscription.findOne({
            apple_original_transaction_id: transactionId,
            cancelled_on_stripe: false,
          });
          if (existingPlanAndActive) {
            return res.status(200).send({
              status: false,
              message: "Plan already added",
            });
          }
          const subscription_details = await SubscriptionModel.findById(id);
          if (!subscription_details) {
            return res.status(200).send({
              status: false,
              message: "No such Plan exist anymore ",
            });
          }

          await UserSubscription.deleteMany({
            user_id: userId,
          });

          await UserFreePlan.deleteMany({
            user_id: userId,
          });
          const endDate = calculateExpiryDate(
            subscription_details.billing_duration.duration,
            subscription_details.billing_duration.unit
          );
          await UserSubscription.create({
            user_id: userId,
            plan_name: subscription_details?.name,
            description: subscription_details?.description,
            price: subscription_details?.price,
            billing_duration: subscription_details?.billing_duration,
            swipes: subscription_details?.swipes,
            connects: subscription_details?.connects,
            chat: subscription_details?.chat,
            video_audio_call: subscription_details?.video_audio_call,
            SubscriptionIsActive: true,
            original_plan_details: subscription_details,
            expires_at: endDate,
            payment_status: "paid",
            payment_done_at: new Date(),
            apple_original_transaction_id: transactionId,
            isapplePurchse: true,
          });
          await PaymentLogModel.create({
            user_id: userId,
            transaction_type: "subscription-renew",
            plan_id: subscription_details._id.toString(),
            amount: subscription_details.price,
            details: {
              swipes: subscription_details?.swipes,
              connects: subscription_details?.connects,
              chat: subscription_details?.chat,
              video_audio_call: subscription_details?.video_audio_call,
            },
            payment_status: "completed",
            payment_completed_at: new Date(),
          });
          await User.findOneAndUpdate(
            {
              apple_latest_transaction_id: transactionId,
            },
            { $set: { apple_latest_transaction_id: "" } }
          );
          await User.findOneAndUpdate(
            {
              _id: new mongoose.Types.ObjectId(userId),
            },
            {
              apple_latest_transaction_id: transactionId,
            }
          );
          return res.status(200).send({
            status: true,
            message: "Plan purchased",
          });
        }
      } else {
        return res
          .status(200)
          .send({ success: false, message: "Invalid receipt." });
      }
    } catch (error) {
      console.error(
        "errorerrorerror-----------------------------------------------------",
        error
      );
      return res
        .status(200)
        .send({ success: false, message: "Error validating receipt.", error });
    }
  } else {
    return res
      .status(200)
      .send({ success: false, message: "Invalid receipt." });
  }
};
