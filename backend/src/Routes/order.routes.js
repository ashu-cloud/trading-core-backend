import express from 'express';
import {getUserOrders , cancelUserOrder , placeUserOrder, placeSellOrder} from '../controllers/order.controller.js';
import {protect} from '../middlewares/auth.middleware.js';

const orderRouter = express.Router();

orderRouter.post('/buy', protect, placeUserOrder);

orderRouter.post('/sell' ,protect ,placeSellOrder);

orderRouter.get('/my',protect ,getUserOrders);

orderRouter.delete('/:orderId', protect,cancelUserOrder);



export default orderRouter;