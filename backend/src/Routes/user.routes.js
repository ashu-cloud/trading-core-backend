import express from 'express';

const userRouter = express.Router();

userRouter.get('/profile', (req, res) => {
  res.json({ message: "User profile" });
});

userRouter.patch('/profile', (req, res) => {
  res.json({ message: "Profile updated" });
});



export default userRouter;
