import * as yup from "yup";
export const ValidatePayment = yup.object({
  body: yup.object({
    id: yup.string().label("id is required"),
  }),
});
