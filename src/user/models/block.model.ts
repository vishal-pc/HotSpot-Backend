// block.model.ts

import mongoose, { Document, Schema } from 'mongoose';

interface IBlock extends Document {
  blockerUserId: mongoose.Types.ObjectId;
  blockedUserId: mongoose.Types.ObjectId;
  timestamp: Date;
}

const blockSchema = new Schema<IBlock>({
  blockerUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  blockedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Block = mongoose.model<IBlock>('Block', blockSchema);

export default Block;