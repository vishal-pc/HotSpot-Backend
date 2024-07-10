import express, { Express, Request, Response } from "express";
import connection from "../config/db.config";
import dotenv from "dotenv";
dotenv.config();
import userRouter from "./user/routes/user.routes";
import bodyParser from "body-parser";
import adminRoute from "./admin/routes/admin.route";
import paymentRouter from "./user/routes/payment.routes";
import cors from "cors";
import { uploadRouter } from "./helper/aws-s3/s3.routes";
import { initializeWebSocket } from "./socket/index";
import http from "http";
import Logger from "./utils/logger";
import morganMiddleware from "./middleware/morgan.middleware";
import mediaRouter from "./media/media.route";
import appleWebhookRoute from "./user/routes/apple.webhook.routes";
import stripeWebhookRoute from "./user/routes/stripe.webhook.routes";
import "./helper/firebase/firebase.config";
import cron from "node-cron";
import { ensureActiveSubscriptionForAllUsers } from "./user/scheduler/freePlan";
// const admin = firebase.initializeApp();
const app: Express = express();
const server: http.Server = http.createServer(app);
const port = process.env.PORT || "3000";
cron.schedule("0 0 * * *", ensureActiveSubscriptionForAllUsers, {
  scheduled: true,
  timezone: "Australia/Sydney",
});
app.use(cors());
app.use("/subscription", stripeWebhookRoute);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morganMiddleware);
// app.use(express.urlencoded({ limit: '25mb', extended: false }));
app.use("/apple-notifications", appleWebhookRoute);
app.use("/user", userRouter);
app.use("/admin", adminRoute);
app.use("/home", uploadRouter);
app.use("/media", mediaRouter);
app.use("/payment", paymentRouter);
// base route
app.get("/", (req, res) => {
  res.send("Hotspot Meet server");
});
// app.use('/', )
function startServer(port: string | undefined) {
  try {
    connection.then(() => {
      Logger.info("database connected!");
      server.listen(port, () => {
        Logger.info(`Server is running on http://localhost:${port}`);
      });
      initializeWebSocket(server);
    });
  } catch (error) {
    Logger.error("Unable to connect to the database:", error);
  }
}
startServer(port);
