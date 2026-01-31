import express from 'express';
import {getUserOrders , cancelUserOrder , placeUserOrder, placeSellOrder, executeBuyOrderAndUpdatePortfolio} from '../controllers/order.controller.js';
import {protect} from '../middlewares/auth.middleware.js';
import Order from '../models/order.model.js';

const orderRouter = express.Router();

orderRouter.post('/buy', protect, placeUserOrder);

orderRouter.post('/sell' ,protect ,placeSellOrder);

orderRouter.get('/my',protect ,getUserOrders);

orderRouter.delete('/:orderId', protect,cancelUserOrder);

orderRouter.get('/:orderId/logs', protect, async (req, res) => {
  const order = await Order.findById(req.params.orderId)
    .select('auditLogs');

  if (!order) {
    return res.status(404).json({ success: false });
  }

  res.json({
    success: true,
    auditLogs: order.auditLogs
  });
});


orderRouter.post('/execute/:orderId', protect,executeBuyOrderAndUpdatePortfolio)



export default orderRouter;