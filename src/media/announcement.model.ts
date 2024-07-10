import mongoose from 'mongoose';
const { Schema } = mongoose;
const announcementSchema = new Schema({
    title: {
		type: String,
		required: true,
	},
    description: {
		type: String,
		required: true,
	},
	mediaUrl: {
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
	key:{
		type:'string',
		default:'active'
	},
    
	
});

const Announcement = mongoose.model('announcement', announcementSchema);

export default Announcement;