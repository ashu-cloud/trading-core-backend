import User from '../models/user.model.js';
import Payment from '../models/payments.model.js';
import BankBalance from '../models/bankBalance.model.js';
import calculateFraudScore from '../utils/fraudScore.js';
import WalletLedger from '../models/paymentsHistory.model.js';
import simulatePaymentGateway from '../utils/PaymentGateways.js';


export const initiatePayment = async (req, res) => {
    const idempotencyKey = req.headers['idempotency-key'];
    const { amount } = req.body;
    const userId = req.user._id;

    try {

        if (!idempotencyKey) {
            return res.status(400).json({ error: 'Missing Idempotency-Key header.' });
        }

        if (!amount || amount <= 0 || amount > 1000000) {
            return res.status(400).json({ error: 'Invalid amount.' });
        }

        // 3. Find user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // 4. Idempotency check
        const existingPayment = await Payment.findOne({ idempotencyKey, userId });
        if (existingPayment) {
            return res.status(200).json({
                message: 'Duplicate request — returning original result.',
                paymentId: existingPayment._id,
                status: existingPayment.status,
                gatewayRef: existingPayment.gatewayRef || null,
                failureReason: existingPayment.failureReason || null
            });
        }

        // 5. Bank balance check
        const bankAccount = await BankBalance.findOne({ userId });
        if (!bankAccount) {
            return res.status(404).json({ error: 'No linked bank account found.' });
        }
        if (bankAccount.balance < amount) {
            await Payment.create({
                userId,
                amount,
                idempotencyKey,
                status: 'FAILED',
                failureReason: 'INSUFFICIENT_FUNDS',
                type: 'deposit',
                fraudScore: 0
            });
            return res.status(402).json({ error: 'Insufficient bank balance.' });
        }

        // 6. Fraud score check
        const fraudScore = await calculateFraudScore(userId, amount, user.createdAt);
        if (fraudScore > 70) {
            await Payment.create({
                userId,
                amount,
                idempotencyKey,
                status: 'FAILED',
                failureReason: 'FRAUD_REJECTED',
                type: 'deposit',
                fraudScore
            });
            return res.status(403).json({
                error: 'Payment blocked due to high fraud risk.',
                fraudScore
            });
        }

        // 7. Create PENDING payment
        const payment = new Payment({
            userId,
            amount,
            idempotencyKey,
            type: 'deposit',
            status: 'PENDING',
            fraudScore
        });
        await payment.save();

        // 8. Call gateway
        const gatewayResult = await simulatePaymentGateway(amount);

        // 9. Gateway declined
        if (!gatewayResult.success) {
            payment.status = 'FAILED';
            payment.failureReason = 'GATEWAY_DECLINED';
            await payment.save();
            return res.status(402).json({
                error: 'Payment declined by gateway.',
                paymentId: payment._id,
                status: payment.status
            });
        }

        // 10. Mark as AUTHORIZED (gateway approved, settlement not yet complete)
        payment.status = 'AUTHORIZED';
        payment.gatewayRef = gatewayResult.gatewayRef;
        await payment.save();

        // 11. Capture balance before mutation
        const balanceBefore = user.wallet_balance;

        // 12. Update bank balance and wallet
        bankAccount.balance -= amount;
        await bankAccount.save();

        await User.findByIdAndUpdate(userId, {
            $inc: { wallet_balance: amount }
        });

        // 13. Write ledger entry
        await WalletLedger.create({
            userId,
            paymentId: payment._id,
            type: 'CREDIT',
            amount,
            bankbalanceBefore: balanceBefore,
            bankbalanceAfter: balanceBefore + amount,
            description: 'Wallet deposit'
        });


        // 14. Mark as SETTLED
        payment.status = 'SETTLED';
        await payment.save();

        return res.status(200).json({
            success: true,
            paymentId: payment._id,
            status: payment.status,
            gatewayRef: payment.gatewayRef,
            newBalance: balanceBefore + amount
        });

    } catch (err) {
        console.error('Payment error:', err);
        res.status(500).json({ error: 'An error occurred while processing the payment.' });
    }
};


export const getPaymentHistory = async (req, res) => {
    try {
        const userId = req.user._id;

        const paymentHistory = await WalletLedger.find({ userId }).sort({ createdAt: -1 })
            .populate('paymentId', 'amount status createdAt gatewayRef failureReason');
        res.status(200).json({ paymentHistory });
    } catch (err) {
        console.error('Error fetching payment history:', err);
        res.status(500).json({ error: 'An error occurred while fetching payment history.' });
    }
};

export const getPaymentById = async (req, res) => {
    const paymentId = req.params.id;
    try {
        const payment = await Payment.findOne({ _id: paymentId, userId: req.user._id });
        if (!payment) {
            return res.status(404).json({ error: 'Payment not found.' });
        }
        res.status(200).json({ payment });
    }
    catch (err) {
        console.error('Error fetching payment:', err);
        res.status(500).json({ error: 'An error occurred while fetching payment details.' });
    }
};
