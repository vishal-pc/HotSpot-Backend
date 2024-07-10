import mongoose, { Document, Schema } from 'mongoose';

interface ISwipe extends Document {
  swiperUserId: mongoose.Types.ObjectId;
  swipeeUserId: mongoose.Types.ObjectId;
  swipeDirection: 'left' | 'right';
  timestamp: Date;
}

const swipeSchema = new Schema<ISwipe>({
  swiperUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  swipeeUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  swipeDirection: {
    type: String,
    enum: ['left', 'right'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Swipe = mongoose.model<ISwipe>('Swipe', swipeSchema);

export default Swipe;