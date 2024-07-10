import dotenv from 'dotenv';
dotenv.config();
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import  multer from 'multer';
import { S3 } from 'aws-sdk';
import { CreateBucketRequest } from 'aws-sdk/clients/s3';
import fs from 'fs';
import { promisify } from 'util';
import { v4 as uuidv4 } from 'uuid';

const deleteTempFile = promisify(fs.unlink);

export const checkBucket = async (s3: S3, bucket: string) => {
	try {
		const res = await s3.headBucket({ Bucket: bucket }).promise();

		 

		return { success: true, message: 'Bucket already Exist', data: {} };
	} catch (error) {
		 
		return { success: false, message: 'Error bucket don\'t exsit', data: error };
	}
};

export const initBucket = async (s3: S3) => {
	const bucketStatus = await checkBucket(s3, `${process.env.BUCKET_NAME}`);
  
	if( !bucketStatus.success ) { // check if the bucket don't exist
		const bucket = await createBucket(s3); // create new bucket 
	}
	return true;
};

export const createBucket = async (s3: S3) => {

	const params: CreateBucketRequest = { Bucket: `${process.env.BUCKET_NAME}`,
		CreateBucketConfiguration: {
			// Set your region here
			LocationConstraint: 'ap-south-1'
		}
	};
	
	try {
		const res = await s3.createBucket(params).promise();
	 
		return {success: true, message: 'Bucket Created Successfull',data: res.Location};
	
	} catch (error) { 
		return {success: false, message: 'Unable to create bucket', data: error};
	
	}
};

export const uploadToS3 = async (s3: S3, fileData?: any) => {
	try {
		const fileContent = fs.readFileSync(fileData!.path);

		const uniqueFileName = uuidv4() + '_' + fileData!.originalname;

		const params: S3.PutObjectRequest = {
			Bucket: `${process.env.BUCKET_NAME}`,
			Key: uniqueFileName,
			Body: fileContent,
			ACL: 'public-read',
		};

		try {
			const res = await s3.upload(params).promise();  
			deleteTempFile(fileData!.path);
			return {
				success: true,
				message: 'File Uploaded with Successfully',
				data: res.Location,
				key:uniqueFileName
			};
		} catch (error) {
			return {
				success: false,
				message: 'Unable to Upload the file',
				data: error,
			};
		}
	} catch (error) {
		return { success: false, message: 'Unalbe to access this file', data: {} };
	}
};

export const deleteToS3 = async(s3:S3, url?: any) => {
	try { 
		const params: S3.PutObjectRequest = {
			Bucket: `${process.env.BUCKET_NAME}`,
			Key: url
		};

		const res = await s3.deleteObject(params).promise();  
		return {
			success: true,
			message: 'File deleted Successfully',
			data: res,
		};
	} catch (error) {
		return {
			success: false,
			message: 'Unable to delete file',
			data: error,
		};
	}
}


// export const uploadToS3withPercentage = async (s3: S3, fileData?: any) => {
// 	try {
// 		await s3Client
//           .putObject(params)
//           .on("httpUploadProgress", (evt) => {
//             setSelectedFiles((pre) => {
//               pre[index] = {
//                 ...pre[index],
//                 status: "Uploading",
//                 progress: (evt.loaded * 100) / evt.total,
//               };
//               return [...pre];
//             });
//           })
//           .promise()
//           .then(async (res) => {
//             await addBulkDocuments({
//               name: file.name,
//               categories: categoriesSelected.slice(1).map((el) => el.name),
//               file: "techno/" + file.id + file.name,
//             })
//               .then(() => {
//                 setSelectedFiles((pre) => {
//                   pre[index] = {
//                     ...pre[index],
//                     status: "Uploaded",
//                     progress: 100,
//                   };
//                   return [...pre];
//                 });
//               })
//               .catch(() => {
//                 setSelectedFiles((pre) => {
//                   pre[index] = {
//                     ...pre[index],
//                     status: "Not Uploaded",
//                     progress: 0,
//                   };
//                   return [...pre];
//                 });
//               })
//               .finally(() => {
//                 if (index === selectedFiles.length - 1) {
//                   setIsUploadingStarted(false);
//                   refetch();
//                 }
//               });
//           });
// 	} catch (error) {
// 		return { success: false, message: 'Unalbe to access this file', data: {} };
// 	}
// };
