import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    amount: {
        type: Number
    },
    merchant: {
        type: String
    },
    status: {
        type: String,
        enum: ['PENDING', 'AUTHORIZED', 'SETTLED', 'FAILED'],

        default: 'PENDING'
    },
    idempotencyKey: {
        type: String,
        required: true,
        unique: true
    },
    fraudScore: {
        type: Number
    },
    failureReason: {
        type: String
    },
    gatewayRef: {
        type: String
    },
    type: {
        type: String,
        enum: ['deposit']
    }
}, { timestamps: true });


export default mongoose.model('Payment', paymentSchema);