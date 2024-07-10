import { Request, Response, NextFunction } from "express";

const validatePayload =
  (schema: any) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validate({
        body: req.body,
      });
      return next();
    } catch (err: any) {
      console.error("errerr", err);
      return res.status(400).json({ type: err.name, message: err.message });
    }
  };
export default validatePayload;
