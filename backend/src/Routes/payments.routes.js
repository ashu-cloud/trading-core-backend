import { initiatePayment, getPaymentHistory, getPaymentById } from '../controllers/payment.controller.js';
import express from 'express';
import { protect } from '../middlewares/auth.middleware.js';

const paymentRouter = express.Router();

paymentRouter.post('/initiate', protect, initiatePayment);
paymentRouter.get('/history', protect, getPaymentHistory);
paymentRouter.get('/:id', protect, getPaymentById);


export default paymentRouter;