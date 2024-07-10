import { Request, Response, NextFunction, RequestHandler } from 'express';

export function progressMiddleware() {
	return (req: Request,
		res: Response,
		next: NextFunction) => {
		const uploadProgress: {
			totalBytes: string | number | bigint  | any;
			uploadedBytes: number;
		} = {
			totalBytes: req.headers['content-length'],
			uploadedBytes: 0,
		};
  
		req.on('data', (chunk: string | unknown[]) => {
			uploadProgress.uploadedBytes += chunk.length;
			// Calculate and send progress percentage to the client
			const progress = (uploadProgress?.uploadedBytes / uploadProgress.totalBytes) * 100;
			 
		});
  
		req.on('end', () => {
			 
		});
  
		next();
	};
}