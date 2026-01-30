import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import Portfolio from '../models/portfolio.model.js';
import {executeBuyOrder} from '../utils/orderExecution.js';
import {fetchStockPrice } from '../utils/marketData.js';


export const getUserOrders = async(req, res)=>{
    try{

        const userId = req.user._id;

        const orders  = await Order.find({userId}).sort({createdAt : -1});

        res.status(200).json({
            success:true,
            count : orders.length,
            orders
        })
       

    }catch(err){
        console.log("GetUserORders error",err.message);
        res.status(500).json({
            success:false,
            message : "Unable to fetch Your Orders"
        })
    }
}



export const cancelUserOrder = async(req , res)=>{
    try{

        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findById(orderId);

        if(!order){
            return res.status(404).json({
                success:false,
                message : "No order with this OrderId exists"
            })
        }

        // Ownership Check
        if(order.userId.toString() !== userId.toString()){
            return res.status(403).json({
                success:false,
                message: "You are not allowed to cancel this order"
            })
        }


        if(order.status === "FILLED"){
            return res.status(400).json({
                success:false,
                message: "Filled orders cannot be cancelled"
            })
        }

        const refundAmount = order.price * order.quantity;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
            success: false,
            message: "User not found"
            });
        }

        user.wallet_balance += refundAmount;
        await user.save();

        // 5️⃣ Cancel order (soft cancel recommended)
        order.status = "CANCELLED";
        await order.save();

        res.status(200).json({
        success: true,
        message: "Order cancelled and wallet refunded"
        });

    }catch(err){
        console.log("Cancel User Order Error" , err.message);
        res.status(500).json({
            success:false,
            message : "Unable to Cancel the Order"
        })
    }
}


export const placeUserOrder = async(req , res)=>{
    try{

        const userId = req.user._id; // get authenticated user from middleware 
        const user = await User.findById(userId);

        if(!user){
            return res.status(401).json({
                success:false,
                message :"User Doesn't exists or not authorized"
            })
        }

        const {symbol , quantity} = req.body;

        if(!symbol){
            return res.status(400).json({
                success:false,
                message: "Symbol required to buy the stock"
            })
        }

        if(!quantity || quantity <= 0){
            return res.status(400).json({
                success:false,
                message : "Quantity of the selected Stock is 0"
            })
        }

        const stockSymbol = symbol.toUpperCase();
        const price = await fetchStockPrice(stockSymbol);
        if (!Number.isFinite(price) || price <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid stock price"
            });
        }



        const orderValue = price*quantity;

        if(user.wallet_balance < orderValue){
            return res.status(400).json({
                success:false,
                message : "Insufficient Wallet Balance"
            })
        }
        
        const order = await Order.create({
            userId,
            stockSymbol,
            quantity,
            price,
            type :"BUY",
            status:"OPEN"
        })

        user.wallet_balance -= orderValue;
        await user.save();

        const trade = await executeBuyOrder({order, userId});



        res.status(201).json({
            success: true,
            message: "Order  Placed and executed successfully",
            orderId:order._id,
            trade : trade._id,

           
        })


    }catch(err){
        console.log("Place user Order error" , err.message),
        res.status(500).json({
            success:false,
            message:"Unable to place Order"
        })
    }
}


export const placeSellOrder = async(req, res)=>{
    try{

        const userId = req.user._id;

        const{symbol , quantity}  = req.body;

        if(!symbol || !quantity || quantity <= 0){
            return res.status(400).json({
                sucess:false,
                message : "Symbol or Valid quantity not found"
            })
        }

        const stockSymbol = symbol.toUpperCase();

        const portfolio = await Portfolio.findOne({user : userId});

        if(!portfolio){
            return res.status(400).json({
                success:false,
                message : "No Holdings found"
            })
        }

        const holding = portfolio.holding.find(
            h => h.stockSymbol === stockSymbol
        );

        if(!holding || holding.quantity < quantity){
            return res.status(400).json({
                success:false,
                message: "Insufficient Holdings"
            })
        }

        const price = await fetchStockPrice(stockSymbol);
        const sellValue = price*quantity;

        const order = await Order.create({
            userId,
            stockSymbol,
            quantity,
            price,
            type:"SELL",
            status :"FILLED"
        })

        // Update Portfolio
        holding.quantity -= quantity;
        if(holding.quantity === 0){
            portfolio.holding = portfolio.holding.filter(
                h=> h.stockSymbol !== stockSymbol
            )
        }
        await portfolio.save();

        // Credit Wallet
        const user = User.findById(userId);
        user.wallet_balance += sellValue;
        await user.save();

        res.status(201).json({
            success:true,
            message: "Sell Order executed",
            orderId : order._id,
            amountCredited : sellValue
        })

    }catch(err){
        console.log("Sell Order error : ", err.message)
        res.status(500).json({
            success:false,
            message : "Failed to place Sell order"
        })
    }
}