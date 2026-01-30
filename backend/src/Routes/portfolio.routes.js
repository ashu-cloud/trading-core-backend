import express from 'express';
import {getPortfolio} from '../controllers/portfolio.controller.js';

const portfolioRouter = express.Router();


portfolioRouter.get("/",getPortfolio);


export default portfolioRouter;


