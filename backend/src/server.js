import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRouter from '../src/Routes/auth.routes.js';
import userRouter from '../src/Routes/user.routes.js';
import walletRouter from '../src/Routes/wallet.routes.js';
import marketRouter from '../src/Routes/market.router.js';
import orderRouter from '../src/Routes/order.routes.js';
import connectDB from '../src/utils/db.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT;

// Connect DB;
await connectDB();

app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());


app.use("/api/auth", authRouter);
app.use('/api/users',userRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/market', marketRouter);
app.use('/api/order' , orderRouter); 


app.listen(PORT , ()=>{
    console.log("app running ");
})