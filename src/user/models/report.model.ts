// report.model.ts

import mongoose, { Document, Schema } from 'mongoose';

interface IReport extends Document {
  reporterUserId: mongoose.Types.ObjectId;
  reportedUserId: mongoose.Types.ObjectId;
  message: string;
  timestamp: Date;
}

const reportSchema = new Schema<IReport>({
  reporterUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reportedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  message: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Report = mongoose.model<IReport>('Report', reportSchema);

export default Report;