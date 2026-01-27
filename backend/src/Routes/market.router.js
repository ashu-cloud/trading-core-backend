import express from 'express';

const marketRouter = express.Router();

marketRouter.get("/stocks", (req, res) => {
  res.json({ message: "Get all stocks" });
});

marketRouter.get("/price/:symbol", (req, res) => {
  res.json({
    symbol: req.params.symbol,
    price: 123.45
  });
});


export default marketRouter;
