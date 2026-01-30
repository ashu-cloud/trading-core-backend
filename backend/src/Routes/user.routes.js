import express from 'express';
import {updateUserProfile , getUserProfile , updateUserPassword} from '../controllers/user.controller.js'
import {protect} from '../middlewares/auth.middleware.js';
const userRouter = express.Router();

userRouter.get('/profile', protect,getUserProfile);

userRouter.patch('/profile',protect, updateUserProfile);

userRouter.patch('/password',protect, updateUserPassword);


export default userRouter;
