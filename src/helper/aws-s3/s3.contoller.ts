import dotenv from "dotenv";
dotenv.config();
import { deleteToS3, initBucket } from "./s3.service";
import { S3 } from "aws-sdk";
import { Request, Response } from "express";
import { uploadToS3 } from "./s3.service";
import { File } from "buffer";

export class UploadController {
  static Upload = async (req: Request, res: Response, file: File) => {
    const s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
    });

    const intializeBucket = await initBucket(s3);

    if (intializeBucket) {
      const uplaodRes = await uploadToS3(s3, file);
      return uplaodRes;
    } else {
      return {
        success: false,
        message: "Error in initializing the bucket",
        data: [],
      };
    }
  };
}

export class UploadMultipleController {
  static UploadMultiple = async (req: Request, res: Response) => {
    const s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
    });

    const intializeBucket = await initBucket(s3);

    if (!intializeBucket) {
      return { success: false, message: "Error in initializing the bucket" };
    }

    if (!req.files || req.files.length === 0) {
      return { success: false, message: "No files were uploaded." };
    }

    const files = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files);

    if (!files || files.length === 0) {
      return { success: false, message: "No files were uploaded." };
    }

    const uploadResults = [];

    for (const file of files) {
      const uploadRes = await uploadToS3(s3, file);

      uploadResults.push(uploadRes);
    }

    const hasUploadFailures = uploadResults.some((result) => !result.success);

    if (hasUploadFailures) {
      return {
        success: false,
        message: "Some files failed to upload",
        data: uploadResults,
      };
    } else {
      return {
        success: true,
        message: "All files uploaded successfully",
        data: uploadResults.map((result) => result.data),
      };
    }
  };
}

export class DeleteController {
  static Delete = async (req: Request, res: Response, file: any) => {
    const s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
    });

    const intializeBucket = await initBucket(s3);

    if (intializeBucket) {
      const uplaodRes = await deleteToS3(s3, file);
      return uplaodRes;
    } else {
      return {
        success: false,
        message: "Error in initializing the bucket",
        data: [],
      };
    }
  };
}
