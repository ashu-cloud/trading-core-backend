import express from 'express';
import {updateUserProfile , getUserProfile , updateUserPassword} from '../controllers/user.controller.js'

const userRouter = express.Router();

userRouter.get('/profile', getUserProfile);

userRouter.patch('/profile', updateUserProfile);

userRouter.patch('/password', updateUserPassword);


export default userRouter;
