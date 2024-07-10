import * as yup from 'yup';
import { Request, Response, NextFunction } from 'express';

// ------------------- Create Admin Validation for Body starts -------------------
const linkSchema = yup.object({
	body: yup.object({
		email: yup.string().email().required().label('Email'),
		password: yup.string().min(8).max(32).required().label('password'),
		first_name: yup.string().min(3).max(255).required().label('first_name'),
		last_name: yup.string().min(3).max(255).required().label('last_name'),
		verifyToken: yup.string().required().label('Token'),
	}),
});

const completeProfileSchema = yup.object({
	body: yup.object({
		question: yup.string().min(1).max(255).required().label('question'),
		questions_name: yup.string().min(1).max(255).required().label('questions_name'),
		input_type: yup.string().min(1).max(255).required().label('input_type'),
		options: yup.array().required().label('options'),
	}),
});

const maximumRadiusSchema = yup.object({
	body: yup.object({
		radius: yup.number()
	}),
});

const validate =
	(schema: any) => async (req: Request, res: Response, next: NextFunction) => {
		try {
			await schema.validate({
				body: req.body,
			});
			return next();
		} catch (err: any) {
			return res.status(200).json({ type: err.name, message: err.message });
		}
	};

export const AdminCreateValidate = validate(linkSchema);
export const CompleteProfileValidate = validate(completeProfileSchema);
export const MaximumRadiusValidate = validate(maximumRadiusSchema);

// ------------------- Create Admin Validation for Body Ends -------------------

// ------------------- Login Admin Validation for Body starts -------------------
const LoginAdminSchema = yup.object({
	body: yup.object({
		email: yup.string().email().required().label('Email'),
		password: yup.string().min(8).max(32).required().label('password'),
	}),
});

const LoginAdminValidate =
	(schema: any) => async (req: Request, res: Response, next: NextFunction) => {
		try {
			await schema.validate({
				body: req.body,
			});
			return next();
		} catch (err: any) {
			return res.status(200).json({ type: err.name, message: err.message });
		}
	};

export const AdminLoginValidate = LoginAdminValidate(LoginAdminSchema);

// ------------------- Create Admin Validation for Body Ends -------------------


// ------------------- Forgot Password Admin Validation Body starts -------------------
const ForgotPasswordSchema = yup.object({
	body: yup.object({
		email: yup.string().email().required().label('Email'), 
		// new_password: yup.string().min(8).max(32).required().label('new_password'),
		// token: yup.string().required().label('token'),
	}),
});

const ForgotPasswordValidate =
	(schema: any) => async (req: Request, res: Response, next: NextFunction) => {
		try {
			await schema.validate({
				body: req.body,
			});
			return next();
		} catch (err: any) {
			return res.status(200).json({ type: err.name, message: err.message });
		}
	};

export const forgotPassValidate = ForgotPasswordValidate(ForgotPasswordSchema);

// -------------------  Forgot Password Validation for Body Ends -------------------


// -------------------View User Details Validation Body starts -------------------
const UserDetailsSchema = yup.object({
	body: yup.object({
		// id: yup.string().required().label('id'), 
		// new_password: yup.string().min(8).max(32).required().label('new_password'),
		// token: yup.string().required().label('token'),
	}),
});

const UserDetailsValidate =
	(schema: any) => async (req: Request, res: Response, next: NextFunction) => {
		try {
			await schema.validate({
				body: req.body,
			});
			return next();
		} catch (err: any) {
			return res.status(200).json({ type: err.name, message: err.message });
		}
	};

export const UserDetails = UserDetailsValidate(UserDetailsSchema);

// -------------------View User Details Validation for Body Ends -------------------


export const activeInactiveUser = yup.object({
	body: yup.object().shape({
		user_id: yup.string().required(),
	  set_status: yup.boolean().required(),
	}),
  });
  