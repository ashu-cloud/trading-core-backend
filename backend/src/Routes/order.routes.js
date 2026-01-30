import express from 'express';
import {getUserOrders , cancelUserOrder , placeUserOrder, placeSellOrder} from '../controllers/order.controller.js';

const orderRouter = express.Router();

orderRouter.post('/buy', placeUserOrder);

orderRouter.post('/sell' , placeSellOrder);

orderRouter.get('/my', getUserOrders);

orderRouter.delete('/:orderId', cancelUserOrder);



export default orderRouter;