import Bull from "bull";
import { createBullRedisClient } from "../radis/bullRedis";
import { SendPushToUser } from "../../user/services/user.service";

interface FcmJobData {
  title: string;
  body: string;
  userFcmToken: string;
  data?: any;
  image?:any;
}

const fcmQueue = new Bull<FcmJobData>("fcmQueue", {
  createClient: createBullRedisClient,
});

fcmQueue.process(async (job) => {
  const { title, body, userFcmToken, data , image} = job.data;
  await SendPushToUser(title, body, userFcmToken, data, image);
});

fcmQueue.on("completed", (job, result) => {
  console.log(`Notification job ${job.id} completed`);
});

fcmQueue.on("failed", (job, err) => {
  console.error(`Notification job ${job.id} failed: ${err.message}`);
});

export const addFcmJob = async (data: FcmJobData) => {
  await fcmQueue.add(data);
};

export default fcmQueue;
