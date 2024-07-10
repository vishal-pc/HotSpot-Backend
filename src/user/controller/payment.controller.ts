import * as paymentServices from "../services/payment.services";
import { Request, Response } from "express";
import { getErrorMessage } from "../../utils/errors.js";

export const CreatePayment = async (req: any, res: Response) => {
  try {
    const result = await paymentServices.CreatePayment(
      req?.body,
      req?.user?.id
    );
    res.status(200).send(result);
  } catch (error) {
    console.error("CreatePayment", error);
    return res.status(500).send(getErrorMessage(error));
  }
};
