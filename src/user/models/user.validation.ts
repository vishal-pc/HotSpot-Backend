import * as yup from "yup";
import { Request, Response, NextFunction } from "express";

// ------------------- Create Admin Validation for Body starts -------------------
const linkSchema = yup.object({
  body: yup.object({
    // email: yup.string().email().required().label('Email'),
    // password: yup.string().min(8).max(32).required().label('password'),
    first_name: yup.string().max(255).required().label("first_name"),
    last_name: yup.string().max(255).label("last_name"),
    interest: yup.array().required().label("interest"),
    // bio: yup.string().required().label("bio"),
    age_range: yup.array().required().label("age_range"),
    interested_in: yup.string().required().label("interested_in"),
    dob: yup.string().required().label("dob"),
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
      return res
        .status(200)
        .json({ status: false, type: err.name, message: err.message });
    }
  };

export const UserProfileComplete = validate(linkSchema);

// ------------------- Create Admin Validation for Body Ends -------------------

// ------------------- Update Admin validation starts -------------------
const linkSchemaUpdateProfile = yup.object({
  body: yup.object({
    // email: yup.string().email().required().label('Email'),
    // password: yup.string().min(8).max(32).required().label('password'),
    first_name: yup.string().min(3).max(255).required().label("first_name"),
    last_name: yup.string().min(3).max(255).required().label("last_name"),
    gender: yup.number().required().label("gender"),
    dob: yup.string().required().label("dob"),
    // address: yup.string().required().label("address"),
  }),
});

const UpdateProfile =
  (schema: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validate({
        body: req.body,
      });
      return next();
    } catch (err: any) {
      return res
        .status(200)
        .json({ status: false, type: err.name, message: err.message });
    }
  };

export const UpdateProfileValidation = UpdateProfile(linkSchemaUpdateProfile);

// ------------------- Update Admin validation Ends -------------------

// ------------------- Swiper Validation starts -------------------
const SwiperSchema = yup.object({
  body: yup.object({
    swipeeUserId: yup.string().required().label("swipeeUserId"),
    swipeDirection: yup.string().required().label("swipeDirection"),
  }),
});

const ValidateSwiper =
  (schema: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validate({
        body: req.body,
      });
      return next();
    } catch (err: any) {
      return res
        .status(200)
        .json({ status: false, type: err.name, message: err.message });
    }
  };

export const Swiper = ValidateSwiper(SwiperSchema);

// ------------------- Swiper Validation Ends -------------------

// ------------------- User Search Validation starts -------------------
const SearchSchema = yup.object({
  body: yup.object({
    searchValue: yup.string().label("Please Send value to be searched in body"),
    page: yup.number().required().label("swipeDirection"),
  }),
});

const ValidateSearch =
  (schema: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validate({
        body: req.body,
      });
      return next();
    } catch (err: any) {
      return res
        .status(200)
        .json({ status: false, type: err.name, message: err.message });
    }
  };

export const Search = ValidateSearch(SearchSchema);

// ------------------- User Search Validation Ends -------------------

// ------------------- User Search Validation starts -------------------
const DeleteStorySchema = yup.object({
  body: yup.object({
    story_id: yup.string().label("Id is required"),
  }),
});

const ValidateDeleteStory =
  (schema: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validate({
        body: req.body,
      });
      return next();
    } catch (err: any) {
      return res
        .status(200)
        .json({ status: false, type: err.name, message: err.message });
    }
  };

export const DeleteStory = ValidateDeleteStory(DeleteStorySchema);

// ------------------- User Search Validation Ends -------------------

// ------------------- User Search Validation starts -------------------
const SaveFCMSchema = yup.object({
  body: yup.object({
    user_fcm: yup.string().label("user_fcm is required"),
    device_id: yup.string().label("device_id is required"),
  }),
});

const ValideUserFCM =
  (schema: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validate({
        body: req.body,
      });
      return next();
    } catch (err: any) {
      return res
        .status(200)
        .json({ status: false, type: err.name, message: err.message });
    }
  };

export const UserFCM = ValideUserFCM(SaveFCMSchema);

// ------------------- User Search Validation Ends -------------------

// ------------------- User Search Validation starts -------------------
const CheckPlans = yup.object({
  body: yup.object({
    isaddon: yup.boolean().required().label("isaddon is required"),
    id: yup.string().required().label("id is required"),
  }),
});

const ValidateCheckPlans =
  (schema: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validate({
        body: req.body,
      });
      return next();
    } catch (err: any) {
      return res
        .status(200)
        .json({ status: false, type: err.name, message: err.message });
    }
  };

export const ValidatePlan = ValidateCheckPlans(CheckPlans);

// ------------------- User Search Validation Ends -------------------

export const UnblockUser = yup.object({
  body: yup.object({
    id: yup.string().label("id is required"),
  }),
});

export const CallLog = yup.object({
  body: yup.object({
    id: yup.string().nullable(),
    conversation_id: yup
      .string()
      .nullable()
      .when("id", {
        is: (id: string | null) => !id || !id.trim(),
        then: (schema) =>
          schema.required(
            "conversation_id is required when id is not provided"
          ),
        otherwise: (schema) => schema.notRequired(),
      }),
    initiator_id: yup
      .string()
      .nullable()
      .when("id", {
        is: (id: string | null) => !id || !id.trim(),
        then: (schema) =>
          schema.required("initiator_id is required when id is not provided"),
        otherwise: (schema) => schema.notRequired(),
      }),
    responder_id: yup
      .string()
      .nullable()
      .when("id", {
        is: (id: string | null) => !id || !id.trim(),
        then: (schema) =>
          schema.required("responder_id is required when id is not provided"),
        otherwise: (schema) => schema.notRequired(),
      }),
    call_status: yup.string().required().label("call_status is required"),
    call_type: yup
      .string()
      .nullable()
      .when("id", {
        is: (id: string | null) => !id || !id.trim(),
        then: (schema) =>
          schema.required("call_type is required when id is not provided"),
        otherwise: (schema) => schema.notRequired(),
      }),
    duration: yup
      .string()
      .nullable()
      .when("id", {
        is: (id: string | null) => id || id?.trim(),
        then: (schema) =>
          schema.required("duration is required when id is provided"),
        otherwise: (schema) => schema.notRequired(),
      }),
  }),
});
