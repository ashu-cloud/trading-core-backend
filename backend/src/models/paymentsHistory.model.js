import mongoose from 'mongoose';

const walletLedgerSchema = new mongoose.Schema({
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['CREDIT', 'DEBIT'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    bankbalanceBefore: {
        type: Number,
        required: true
    },
    bankbalanceAfter: {
        type: Number,
        required: true
    },
    description: {
        type: String
    }
}, { timestamps: true });

export default mongoose.model('WalletLedger', walletLedgerSchema);