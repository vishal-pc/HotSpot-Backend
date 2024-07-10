import { Request } from 'express';
import multer, { FileFilterCallback } from 'multer';

type FileNameCallback = (error: Error | null, filename: string) => void


const storage = multer.diskStorage({
	destination: 'uploads/',
	filename: (req: Request, file: Express.Multer.File, cb: FileNameCallback) => {
		// Define the filename for the uploaded file
		cb(null, file.originalname);
	},
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: FileFilterCallback) => {
	if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'video/quicktime') {
		// Accept the file
		cb(null, true);
	} else {
		// Reject the file
		cb(null, false);
	}
};


const multerConfig: multer.Options = {
	storage: storage,
	// fileFilter: fileFilter,
};

const upload  = multer(multerConfig);

export default upload;