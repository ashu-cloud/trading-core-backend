import BankBalance from '../models/bankBalance.model.js';
import Payment from '../models/payments.model.js';

export default async function calculateFraudScore(userId, amount, userCreatedAt) {
    let score = 0;

    // high amount transactions
    if (amount > 500000) {
        score += 40;
    }
    else if (amount > 100000) {
        score += 20;
    }

    // failed transactions in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failedTransactions = await Payment.countDocuments({
        userId,
        status: 'FAILED',
        createdAt: { $gte: oneDayAgo }
    });

    if (failedTransactions > 5) {
        score += 30;
    }
    else if (failedTransactions > 1) {
        score += 10;
    }

    // account age 
    const accountAgeInDays = (Date.now() - new Date(userCreatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (accountAgeInDays < 7) {
        score += 20;
    }
    else if (accountAgeInDays < 30) {
        score += 10;
    }


    // repeated amount transactions in the last 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const repeatedAmountTransactions = await Payment.countDocuments({
        userId,
        amount,
        createdAt: { $gte: oneHourAgo }
    });
    if (repeatedAmountTransactions > 3) {
        score += 20;
    }
    score = Math.min(score, 100);

    return score;
}