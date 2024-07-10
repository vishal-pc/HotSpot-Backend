import mongoose from 'mongoose';
const { Schema } = mongoose;

const OccupationSchema = new Schema({ 
	name: {
		type: String,
		required: true,
	},

});

const Occupation = mongoose.model('Occupation', OccupationSchema);

export default Occupation;
