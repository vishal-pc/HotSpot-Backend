import jwt, { Secret, JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import dotenv from 'dotenv';
dotenv.config();
export const SECRET_KEY: Secret =
	'aqaswedrfgtyhjuikolpmnhbvcxzPLKOIJMNCFVGBHUYTRESAWZXSDCFE00864297531';
	
export interface CustomRequest extends Request {
	user: {
        token:string
    }
}
// interface IGetUserAuthInfoRequest extends Request {
// 	user: string | JwtPayload
// }
export const socialauth: RequestHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
         
		const token = req.header('Authorization')?.replace('Bearer ', '');
         
		if (!token) {
			throw new Error();
		} 
		(req as CustomRequest).user = {
            token:token
        };
		next();
	} catch (err) {
        res.status(401).send({
			message: 'Token not found or invalid',
			status: false,
		});
	}
};
