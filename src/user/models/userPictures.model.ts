/* eslint-disable indent */
import mongoose from 'mongoose';
const { Schema } = mongoose;

const userPictures = new Schema({
	user_id: {
		type: String,
		required: true,
		ref: 'User',
	},
	picture_id: {
        type: String,
        required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
	isProfilePicture: {
		type: Boolean,
		default: false
	}
});

const userPicture = mongoose.model('userpictures', userPictures);

export default userPicture;
