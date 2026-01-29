import express from 'express';
import {getStockPrice ,getAllStocks }from '../controllers/maket.controller.js';

const marketRouter = express.Router();

marketRouter.get("/stocks", getAllStocks);

marketRouter.get("/price/:symbol", getStockPrice);


export default marketRouter;
