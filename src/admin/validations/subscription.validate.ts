import * as yup from "yup";
export const createSubscriptionPlanBodySchema = yup.object({
  body: yup.object().shape({
    name: yup.string().min(3).required().trim(),

    price: yup.number().required(),
    billing_duration: yup.object().shape({
      duration: yup.number().required(),
      unit: yup.mixed().oneOf(["week", "month", "year", "day"]).required(),
    }),
    description: yup.string().min(3).max(200).required().trim(),
    swipes: yup.object().shape({
      type: yup.string().required(),
      count: yup
        .number()
        .nullable()
        .transform((value, originalValue) => (!originalValue ? null : value))
        .when("type", {
          is: "custom_swipes",
          then: (schema) =>
            schema
              .positive("Number of swipes can't less then and equal zero")
              .required("Number of swipes are required"),
        }),
    }),
    connects: yup.object().shape({
      type: yup
        .string()
        .required(),
      count: yup
        .number()
        .nullable()
        .transform((value, originalValue) => (!originalValue ? null : value))
        .when("type", {
          is: "custom_connects",
          then: (schema) =>
            schema
              .positive("Number of connects can't less then zero")
              .required("Number of connects are required"),
        }),
    }),

    chat: yup.boolean().required().label("Chat"),
    colors: yup.array().of(yup.string()).required().label("Colors"),
    buttonTextColor: yup.string().required().trim(),
    video_audio_call: yup.object().shape({
      isAvailable: yup.boolean().required().label("Video and audio call"),
      duration: yup
        .number()
        .nullable()
        .transform((value, originalValue) => (!originalValue ? null : value))
        .when("isAvailable", {
          is: true,
          then: (schema) =>
            schema
              .positive("Duration can't less then zero")
              .required("Duration is required"),
        }),
    }),
  }),
});
export const changeSubscriptionPlanStatusBodySchema = yup.object({
  body: yup.object().shape({
    id: yup.string().required(),
    isActive: yup.boolean().required(),
  }),
});

export const changeFreePlanStatusBodySchema = yup.object({
  body: yup.object().shape({
    id: yup.string().required(),
    is_active: yup.boolean().required(),
  }),
});



export const createAddONPlanBodySchema = yup.object({
  body: yup.object().shape({
    name: yup.string().min(3).required().trim(),
    price: yup.number().required(),
    description: yup.string().min(3).max(200).required().trim(),
    benefits : yup.object().shape({ 
      name:yup.mixed().oneOf(["swipes", "connects", "video_audio_call"]).required(),
      value: yup.number().required(), 
      })
  }),
});


export const createFreePlanBodySchema = yup.object({
  body: yup.object().shape({
    data: yup.object().shape({
      name: yup.string().min(3).required().trim(),
      swipes: yup.number().required(), 
      connects: yup.number().required(), 
      video_audio_call: yup.number().required(), 
      renewalTime: yup.number().required(), 
    })
  }),
});
