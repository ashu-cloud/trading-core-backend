import mongoose from 'mongoose';

const BankBalanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        required: true
    }
}, { timestamps: true });


export default mongoose.model('BankBalance', BankBalanceSchema);