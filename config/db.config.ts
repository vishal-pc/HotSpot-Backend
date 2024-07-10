import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const connection = mongoose.connect(`${process.env.MONGO_DEV_URI}`);
export default connection;
