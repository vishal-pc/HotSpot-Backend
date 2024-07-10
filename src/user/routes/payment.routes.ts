import dotenv from "dotenv";
dotenv.config();
import express from "express";
import * as paymentCopntroller from "../controller/payment.controller";
import { auth } from "../../middleware/auth";
import validatePayload from "../../utils/payloadValidater";
import * as paymentValidator from "../validator/payment.validators"; 

const paymentRouter = express.Router(); 
paymentRouter.post(
  "/create_payment",
  validatePayload(paymentValidator.ValidatePayment),
  [auth],
  paymentCopntroller.CreatePayment
);

export default paymentRouter;
