import mongoose, { Document, Schema } from 'mongoose';

interface IMatch extends Document {
  users: [mongoose.Types.ObjectId];
  timestamp: Date;
}

const matchSchema = new Schema<IMatch>({
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Match = mongoose.model<IMatch>('Match', matchSchema);

export default Match;