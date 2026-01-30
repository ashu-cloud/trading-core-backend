import express from 'express';
import { SignUp , login , getMe } from '../controllers/auth.controller.js'
import {protect} from '../middlewares/auth.middleware.js';
const authRouter = express.Router();


authRouter.post('/sign-up', protect, SignUp);

authRouter.post('/login',protect, login);

authRouter.get('/me',protect, getMe);


export default authRouter;