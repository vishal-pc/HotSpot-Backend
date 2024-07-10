import mongoose from 'mongoose';
const { Schema } = mongoose;

const ChatImagesSchema = new Schema({
	userId: {
		type: Schema.ObjectId,
		required: true,
	},
	mediaUrl: {
		type: String,
		required: true,
	},
	meta: {
		type: String, 
	}, 
	createdAt: {
		type: Date,
		default: Date.now,
	},
	mediaType:{
		type:String
	},
	status:{
		type:'string',
		default:'active'
	},
	fileType:{
		type:'string',
		default:'active'
	},
});

const ChatImages = mongoose.model('charImages', ChatImagesSchema);

export default ChatImages;
