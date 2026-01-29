import express from 'express';

const orderRouter = express.Router();

orderRouter.post('/', (req, res) => {
  res.json({ message: "Place order" });
});

orderRouter.get('/my', (req, res) => {
  res.json({ message: "Get my orders" });
});

orderRouter.delete('/:orderId', (req, res) => {
  res.json({ message: "Cancel order" });
});



export default orderRouter;