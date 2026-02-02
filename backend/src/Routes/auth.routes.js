import express from 'express';
import { SignUp , login , getMe,logout } from '../controllers/auth.controller.js'
import {protect} from '../middlewares/auth.middleware.js';
const authRouter = express.Router();


authRouter.post('/sign-up', SignUp);

authRouter.post('/login', login);

authRouter.get('/me',protect, getMe);

authRouter.post('/logout' , protect ,logout);


export default authRouter;