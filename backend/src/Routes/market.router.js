import express from 'express';
import {getStockPrice ,getAllStocks }from '../controllers/maket.controller.js';
import {protect} from '../middlewares/auth.middleware.js';
import {marketLimiter} from '../middlewares/rateLimit.middleware.js';


const marketRouter = express.Router();

marketRouter.use(marketLimiter);

marketRouter.get("/stocks",protect , getAllStocks);

marketRouter.get("/price/:symbol", protect,getStockPrice);


export default marketRouter;
