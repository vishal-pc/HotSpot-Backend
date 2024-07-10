const mongoose = require('mongoose');
const { Schema } = mongoose;

const forgotPasswordTokenSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'user' 
    },
    token: {
        type: String,
        required: true
    },
    expires: {
        type: Date,
        required: true,
        default: () => Date.now() + 300000 
    }
});

const ForgotPasswordToken = mongoose.model('ForgotPasswordToken', forgotPasswordTokenSchema);