import express from 'express';
import {getStockPrice ,getAllStocks,getStockHistory }from '../controllers/maket.controller.js';
import {protect} from '../middlewares/auth.middleware.js';
import {marketLimiter} from '../middlewares/rateLimit.middleware.js';


const marketRouter = express.Router();

marketRouter.use(marketLimiter);

marketRouter.get("/stocks" , getAllStocks);

marketRouter.get("/price/:symbol", protect,getStockPrice);

marketRouter.get('/history/:symbol',protect,getStockHistory )


export default marketRouter;
