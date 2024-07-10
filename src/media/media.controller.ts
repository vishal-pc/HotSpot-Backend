import { Request, Response } from "express";
import {
  DeleteController,
  UploadController,
  UploadMultipleController,
} from "../helper/aws-s3/s3.contoller";
import Media from "./media.model";
import { CustomRequest } from "../user/user.interface";
import Story from "../user/models/story.model";
import User from "../user/models/user.model";
import { addFcmJob } from "../helper/Queues/pushQueue";
import Announcement from "./announcement.model";
import mongoose from "mongoose";
import UserFreePlan from "../user/models/userFreePlan.model";
import PaymentLogModel from "../user/models/paymentLogs.model";

export const uploadStory = async (req: any, res: Response) => {
  const user_id = req.user.id;
  try {
    const Stories = req?.files["stories"];
    const caption = req?.body?.caption;
    if (Stories.length) {
      const StoryFile = Stories[0];
      const fileSize = StoryFile.size / 1024 / 1024;

      const StoryUpload = await UploadController.Upload(req, res, StoryFile);
      if (StoryUpload?.success) {
        const uploadLocation = StoryUpload?.data;
        const fileType = StoryFile?.mimetype?.split("/")[0];
        const uploadDetails = new Story({
          user_id: user_id,
          mediaUrl: uploadLocation,
          type: fileType,
          caption: caption,
        });
        await uploadDetails.save();
        return res.status(201).json({
          status: true,
          message: "Story uploaded successfully",
          mediaUrl: uploadLocation,
        });
      } else {
        throw Error("Error in saving story");
      }
    } else {
      return res.status(200).json({
        status: false,
        message: "Please send correct images!",
      });
    }
  } catch (err) {
    console.error("errerr", err);
    return res.status(401).json({
      status: false,
      message: "Something Went Wrong!",
    });
  }
};

export const uploadChat = async (req: any, res: Response) => {
  const user_id = req.user.id;
  try {
    const images = req?.files["chat_images"];
    if (images.length) {
      const imageFile = images[0];
      const imageUpload = await UploadController.Upload(req, res, imageFile);
      if (imageUpload?.success) {
        const uploadLocation = imageUpload?.data;
        const fileType = imageFile?.mimetype?.split("/")[0];
        // const SaveImage = new Media({
        //   mediaType: "chat",
        //   mediaUrl: imageUpload.data,
        //   userId: user_id,
        //   fileType:fileType
        // });
        // await SaveImage.save();
        return res.status(201).json({
          status: true,
          message: "Image uploaded successfully",
          mediaUrl: uploadLocation,
        });
      } else {
        throw Error("Error in saving story");
      }
    } else {
      return res.status(200).json({
        status: false,
        message: "Please send correct images!",
      });
    }
  } catch (err) {
    console.error("errerr", err);
    return res.status(401).json({
      status: false,
      message: "Something Went Wrong!",
    });
  }
};

export const uploadMultipleImages = async (req: any, res: Response) => {
  const user_id = req?.user?.id;
  try {
    const profileImages = req.files["profileImage"];
    const backgroundImage = req.files["backgroundImage"];
    const galleryImages = req.files["galleryImages"];

    if (profileImages && profileImages.length > 0) {
      const profileImage = profileImages[0];
      await Media.updateMany(
        { userId: user_id, mediaType: "profile" },
        { status: "inactive" }
      );
      const profileImageUploadRes = await UploadController.Upload(
        req,
        res,
        profileImage
      );
      if (profileImageUploadRes?.success) {
        const profileImageDetails = new Media({
          mediaType: "profile",
          mediaUrl: profileImageUploadRes?.data,
          userId: user_id,
        });
        await profileImageDetails.save();
      } else {
        return res.status(201).json({
          status: false,
          message: "Cannot upload images to server",
        });
      }
    }

    if (backgroundImage && backgroundImage.length > 0) {
      const backgroundImageFile = backgroundImage[0];
      const backgroundImageUploadRes = await UploadController.Upload(
        req,
        res,
        backgroundImageFile
      );

      if (backgroundImageUploadRes?.success) {
        const backgroundImageDetails = new Media({
          mediaType: "background",
          mediaUrl: backgroundImageUploadRes.data,
          userId: user_id,
        });
        await backgroundImageDetails.save();
      } else {
        return res.status(201).json({
          status: false,
          message: "Cannot upload images to server",
        });
      }
    }

    if (galleryImages && galleryImages.length > 0) {
      const galleryImagePromises = galleryImages.map(
        async (galleryImage: any) => {
          const galleryImageUploadRes = await UploadController.Upload(
            req,
            res,
            galleryImage
          );
          if (galleryImageUploadRes?.success) {
            const galleryImageDetails = new Media({
              mediaType: "gallery",
              mediaUrl: galleryImageUploadRes.data,
              userId: user_id,
            });
            await galleryImageDetails.save();
          } else {
            return res.status(201).json({
              status: false,
              message: "Cannot upload images to server",
            });
          }
        }
      );
      try {
        await Promise.all(galleryImagePromises);
      } catch (error) {
        res.status(201).json({
          status: false,
          message: "All lmages cannot be upload",
        });
      }
    }

    return res.status(201).json({
      status: true,
      message: "Images uploaded successfully",
    });
  } catch (err) {
    console.error("error in uploadMultipleImages", err);
    return res.status(500).json({
      status: false,
      message: "Something Went Wrong!",
    });
  }
};

// export const deleteUploadedImages = async (req: any, res: Response) => {
//   try {
//     const image_id = req.body.file_id;
//     const type = req.body.type;
//     if (type == "gallery_image") {
//       const deleteImage = await Media.findOneAndUpdate(
//         { _id: image_id },
//         { status: "inactive" }
//       );
//       if (deleteImage) {
//         return res.status(200).json({
//           status: false,
//           message: "Image deleted ",
//         });
//       } else {
//         return res.status(200).json({
//           status: false,
//           message: "Image not deleted",
//         });
//       }
//     } else {
//       return res.status(200).json({
//         status: false,
//         message: "Please send type",
//       });
//     }
//   } catch (err) {
//     console.log("deleteUploadedImages Err--->>>", err);
//     return res.status(200).json({
//       status: false,
//       message: "Something went wrong",
//     });
//   }
// };

export const deleteUploadedImages = async (req: any, res: Response) => {
  try {
    const image_id = req.body.file_id;
    const type = req.body.type;

    if (type === "gallery_image") {
      // Find the image record in the Media table
      const imageRecord = await Media.findById({ _id: image_id });

      if (imageRecord) {
        // Delete the file from AWS S3
        const deleteResponse = await DeleteController.Delete(
          req,
          res,
          imageRecord.mediaUrl
        );

        if (deleteResponse.success) {
          // Delete the image record from the Media table
          await Media.findByIdAndDelete({ _id: image_id });

          return res.status(200).json({
            status: true,
            message: "Image deleted successfully",
          });
        } else {
          return res.status(500).json({
            status: false,
            message: "Failed to delete image from S3",
            data: deleteResponse.message,
          });
        }
      } else {
        return res.status(404).json({
          status: false,
          message: "Image not found",
        });
      }
    } else {
      return res.status(400).json({
        status: false,
        message: "Invalid type provided",
      });
    }
  } catch (err) {
    console.error("deleteUploadedImages Err--->>>", err);
    return res.status(200).json({
      status: false,
      message: "Something went wrong",
    });
  }
};

export const sendAnnouncement = async (req: any, res: Response) => {
  try {
    let file = req.files;
    let body = req.body;
    let userType = req.body;

    if (body.title) {
      var uploadLocation: any = "";
      if (file?.file) {
        const imageFile = file?.file[0];
        const imageUpload = await UploadController.Upload(req, res, imageFile);
        uploadLocation = imageUpload;
      }
      let users = [];
      if (userType === "allUser") {
        users = await User.aggregate([
          {
            $lookup: {
              from: "userfcms",
              localField: "_id",
              foreignField: "user_id",
              as: "userfcms",
            },
          },
          {
            $unwind: "$userfcms",
          },
          {
            $match: {
              is_user_active: true,
              "userfcms.fcm_token": { $exists: true, $ne: "" },
            },
          },
        ]);
      } else if (userType === "subscribed") {
        users = await PaymentLogModel.aggregate([
          {
            $match: {
              transaction_type: { $in: ["subscription", "subscription-renew"] },
              payment_status: "completed",
            },
          },
          {
            $lookup: {
              from: "subscriptions_plans",
              localField: "plan_id",
              foreignField: "_id",
              as: "planDetails",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          { $unwind: "$planDetails" },
          { $unwind: "$userDetails" },
          {
            $lookup: {
              from: "userfcms",
              localField: "user_id",
              foreignField: "user_id",
              as: "userfcms",
            },
          },
          { $unwind: "$userfcms" },
          {
            $match: {
              "userDetails.is_user_active": true,
              "userfcms.fcm_token": { $exists: true, $ne: "" },
            },
          },
        ]);
      } else if (userType === "addon") {
        users = await PaymentLogModel.aggregate([
          {
            $match: { transaction_type: "addon", payment_status: "completed" },
          },
          {
            $lookup: {
              from: "addonpurchases",
              localField: "plan_id",
              foreignField: "_id",
              as: "planDetails",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          { $unwind: "$planDetails" },
          { $unwind: "$userDetails" },
          {
            $lookup: {
              from: "userfcms",
              localField: "user_id",
              foreignField: "user_id",
              as: "userfcms",
            },
          },
          { $unwind: "$userfcms" },
          {
            $match: {
              "userDetails.is_user_active": true,
              "userfcms.fcm_token": { $exists: true, $ne: "" },
            },
          },
        ]);
      } else if (userType === "free") {
        users = await UserFreePlan.aggregate([
          {
            $lookup: {
              from: "freeplans",
              localField: "freePlanId",
              foreignField: "_id",
              as: "freeplanDetails",
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "user_id",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          { $unwind: "$freeplanDetails" },
          { $unwind: "$userDetails" },
          {
            $lookup: {
              from: "userfcms",
              localField: "user_id",
              foreignField: "user_id",
              as: "userfcms",
            },
          },
          { $unwind: "$userfcms" },
          {
            $match: {
              "userDetails.is_user_active": true,
              "userfcms.fcm_token": { $exists: true, $ne: "" },
            },
          },
        ]);
      }

      users.forEach((user, idx) => {
        if (user?.userfcms != undefined) {
          let notificationData = {
            title: body.title,
            body: body.description,
            userFcmToken: user?.userfcms?.fcm_token,
            data: {},
            image: uploadLocation?.data,
          };
          addFcmJob(notificationData).then(() => {});
        }
      });
      const fileType = uploadLocation?.data?.mimetype?.split("/")[0];
      const uploadDetails = new Announcement({
        title: body.title,
        description: body.description,
        userType: body.userType,
        mediaUrl: uploadLocation?.data,
        type: fileType,
        key: uploadLocation?.key,
      });
      await uploadDetails.save();
      return res.status(200).json({
        status: true,
        message: "success",
      });
    } else {
      return res.status(400).json({
        status: false,
        message: "Please send correct images!",
      });
    }
  } catch (err) {
    console.error("errerr", err);
    return res.status(401).json({
      status: false,
      message: "Something Went Wrong!",
    });
  }
};

export const deleteAnnouncemnet = async (req: any, res: Response) => {
  let body = req?.body;

  if (body?.id) {
    let announcement = await Announcement.findById(body?.id);

    if (announcement) {
      await DeleteController.Delete(req, res, `${announcement?.key}`);
    }

    const deleteImage = await Announcement.deleteOne({ _id: body?.id });
    return res.status(200).json({
      status: true,
      message: "success!",
    });
  }

  return res.status(400).json({
    status: false,
    message: "Something Went Wrong!",
  });
};

export const getUserProfileImage = async (req: any, res: Response) => {
  const { userId } = req.params;
  if (!userId) return;
  const user_id = new mongoose.Types.ObjectId(userId);
  const media = await Media.findOne({
    userId: user_id,
    mediaType: "profile",
    status: "active",
  });

  if (media) {
    return res.redirect(media.mediaUrl);
  } else {
    return res.status(404).json({ message: "Image not found for user" });
  }
};
