import express from 'express';
import {getUserOrders , cancelUserOrder , placeUserOrder} from '../controllers/order.controller.js';

const orderRouter = express.Router();

orderRouter.post('/', placeUserOrder);

orderRouter.get('/my', getUserOrders);

orderRouter.delete('/:orderId', cancelUserOrder);



export default orderRouter;