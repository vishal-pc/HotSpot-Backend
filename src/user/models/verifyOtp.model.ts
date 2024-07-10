import mongoose from 'mongoose';
const { Schema } = mongoose;

const MobileOtpSchema = new Schema({
	mobile: {
		type: String,
		required: true,
	},

	otp: {
		type: Number,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

const MobileOTP = mongoose.model('MobileOtp', MobileOtpSchema);

export default MobileOTP;
