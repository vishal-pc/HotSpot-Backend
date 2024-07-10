import mongoose from 'mongoose';
const { Schema } = mongoose;

const GenderSchemas = new Schema({ 
	name: {
		type: String,
		required: true,
	},
	value: {
		type: Number,
		required: true,
	},
});

const Gender = mongoose.model('Gender', GenderSchemas);

export default Gender;
