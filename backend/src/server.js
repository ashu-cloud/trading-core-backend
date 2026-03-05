import './config/env.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors'; // Make sure you ran: npm install cors
import authRouter from '../src/Routes/auth.routes.js';
import userRouter from '../src/Routes/user.routes.js';
import walletRouter from '../src/Routes/wallet.routes.js';
import portfolioRouter from '../src/Routes/portfolio.routes.js';
import marketRouter from '../src/Routes/market.router.js';
import orderRouter from '../src/Routes/order.routes.js';
import connectDB from '../src/utils/db.js';
import { errorHandler } from '../src/middlewares/error.middleware.js';

const app = express();

// --- FIX 1: HANDLE EMPTY PORT STRING ---
// We use Number() to convert "" to 0, which makes the || 5000 fallback work
const PORT = Number(process.env.PORT) || 5000; 

// Connect DB;
await connectDB();

// --- FIX 2: CORS CONFIGURATION ---
app.use(cors({
  origin: [
    "https://trading-core-frontend.onrender.com" 
  ], 
  credentials: true,               // Essential for cookies
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({extended : true}));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use('/api/users', userRouter);
app.use('/api/market', marketRouter);
app.use('/api/order' , orderRouter); 
app.use('/api/portfolio', portfolioRouter);
app.use('/api/user/wallet', walletRouter);

app.get('/', (req, res) => {
  res.send('Trading Core Backend is up and running!');
});

app.use(errorHandler);

app.listen(PORT , ()=>{
    console.log(`app running on port ${PORT}`);
})