import express from 'express';
import {getPortfolio} from '../controllers/portfolio.controller.js';
import {protect} from '../middlewares/auth.middleware.js';
const portfolioRouter = express.Router();


portfolioRouter.get("/",protect, getPortfolio);


export default portfolioRouter;


