import express from 'express';
import authRouter from '../src/Routes/auth.routes.js';
import userRouter from '../src/Routes/user.routes.js';
import walletRouter from '../src/Routes/wallet.routes.js';
import marketRouter from '../src/Routes/market.router.js';
import orderRouter from '../src/Routes/order.routes.js';
const app = express();


app.use("/api/auth", authRouter);
app.use('/api/users',userRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/market', marketRouter);
app.use('/api/order' , orderRouter); 


app.listen(3000 , ()=>{
    console.log("app running ");
})