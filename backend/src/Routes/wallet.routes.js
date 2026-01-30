import express from 'express';
import {getUserBalance , depositMoney} from '../controllers/wallet.controller.js'
const walletRouter = express.Router();
import {protect} from '../middlewares/auth.middleware.js';

walletRouter.get("/", protect,getUserBalance);

walletRouter.post("/add", protect, depositMoney);


export default walletRouter;