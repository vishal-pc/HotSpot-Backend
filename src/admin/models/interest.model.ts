import mongoose from 'mongoose';
const { Schema } = mongoose;

const InterestSchema = new Schema({ 
	name: {
		type: String,
		required: true,
	},

});

const Interests = mongoose.model('Interests', InterestSchema);

export default Interests;
