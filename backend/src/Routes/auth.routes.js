import express from 'express';
import { SignUp , login , getMe } from '../controllers/auth.controller.js'
import {protect} from '../middlewares/auth.middleware.js';
const authRouter = express.Router();


authRouter.post('/sign-up', SignUp);

authRouter.post('/login', login);

authRouter.get('/me',protect, getMe);


export default authRouter;