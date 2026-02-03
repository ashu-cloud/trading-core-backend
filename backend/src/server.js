import './config/env.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRouter from '../src/Routes/auth.routes.js';
import userRouter from '../src/Routes/user.routes.js';
import walletRouter from '../src/Routes/wallet.routes.js';
import portfolioRouter from '../src/Routes/portfolio.routes.js';
import marketRouter from '../src/Routes/market.router.js';
import orderRouter from '../src/Routes/order.routes.js';
import connectDB from '../src/utils/db.js';
import {errorHandler} from '../src/middlewares/error.middleware.js';

const app = express();
const PORT = process.env.PORT;

// Connect DB;
await connectDB();

// This MUST come before your routes
app.use(cors({
  origin: "http://localhost:5173", // URL of your React Frontend
  credentials: true,               // Essential for cookies to work
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());



app.use("/api/auth", authRouter);
app.use('/api/users',userRouter);
// app.use('/api/wallet', walletRouter);  Review this again 
app.use('/api/market', marketRouter);
app.use('/api/order' , orderRouter); 
app.use('/api/portfolio', portfolioRouter);
app.use('/api/user/wallet', walletRouter);

app.use(errorHandler);

app.listen(PORT , ()=>{
    console.log("app running ");
})