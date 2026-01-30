import express from 'express';
import {getPortfolio , getPortfolioAllocation} from '../controllers/portfolio.controller.js';
import {protect} from '../middlewares/auth.middleware.js';
const portfolioRouter = express.Router();


portfolioRouter.get("/",protect, getPortfolio);

portfolioRouter.get('/allocation' , protect ,getPortfolioAllocation)


export default portfolioRouter;


