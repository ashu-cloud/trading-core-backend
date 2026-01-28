import express from 'express';
import {getUserBalance , depositMoney} from '../controllers/wallet.controller.js'
const walletRouter = express.Router();


walletRouter.get("/", getUserBalance);

walletRouter.post("/add", depositMoney);


export default walletRouter;