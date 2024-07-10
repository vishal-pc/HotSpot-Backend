import express from 'express';
import { UploadController } from './s3.contoller';
import upload from '../../middleware/multer.config';

const uploadRouter = express.Router();

// uploadRouter.post('/upload_file', upload.single('avatar'), UploadController.Upload);

export { uploadRouter };