import express from "express";
const mediaRouter = express.Router();
import upload from "../middleware/multer.config";
import { auth } from "../middleware/auth";
import * as mediaController from "./media.controller";
import { progressMiddleware } from "../middleware/progressMiddleware";

mediaRouter.post(
  "/upload_file",
  [auth],
  progressMiddleware(),
  upload.fields([
    { name: "profileImage", maxCount: 1 },
    { name: "backgroundImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
  ]),
  mediaController.uploadMultipleImages
);

mediaRouter.post("/delete_file", [auth], mediaController.deleteUploadedImages);

mediaRouter.post(
  "/upload_story",
  [auth],
  progressMiddleware(),
  upload.fields([{ name: "stories", maxCount: 10 }]),
  mediaController.uploadStory
);

mediaRouter.post(
  "/chat_images",
  [auth],
  progressMiddleware(),
  upload.fields([{ name: "chat_images", maxCount: 10 }]),
  mediaController.uploadChat
);

mediaRouter.post(
  "/send_announcement",
  [auth],
  progressMiddleware(),
  upload.fields([{ name: "file", maxCount: 1 }]),
  mediaController.sendAnnouncement
);
mediaRouter.post(
  "/delete_announcement",
  [auth],
  mediaController.deleteAnnouncemnet
);
mediaRouter.get("/:userId", mediaController.getUserProfileImage);

export default mediaRouter;
