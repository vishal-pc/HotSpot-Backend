import mongoose from 'mongoose';

const { Schema } = mongoose;

const commentSchema = new Schema({
  user_id: {
    type: Schema.ObjectId,
    required: true,
  }, 
  story_id: {
    type: Schema.ObjectId,
    required: true,
  },
  comment: {
    type: String,
    required: true,
  },
  commented_at: {
    type: Date,
    default: Date.now,
  },
});

const Comment = mongoose.model('comment', commentSchema);

export default Comment;
