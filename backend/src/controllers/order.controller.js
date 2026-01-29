import Portfolio from '../models/portfolio.model.js';
import Order from '../models/order.model.js';
import {fetchStockPrice , fetchAllStocks} from '../utils/marketData.js';


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
        res.statu(500).json({
            success:false,
            message : "Unable to fetch Your Orders"
        })
    }
}



export const cancelUserOrder = async(req , res)=>{
    try{

        const { orderId } = req.params;
        const userId = req.user._id;

        if(!userId){
            return res.status(404).json({
                success:false,
                message : "User not logged In"
            })
        }

        const order = await Order.findById({orderId});

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
                message: "Filled orderes cannot be cancelled"
            })
        }

        // Cancel Order
        await Order.findByIdAndDelete(orderId);


        res.status(200).json({
            success:true,
            message : "Order successfully Deleted"
        })

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

        const user = req.user._id; // get authenticated user from middleware 

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

        if(!quantity || quantity < 0){
            return res.status(400).json({
                success:false,
                message : "Quantity of the selected Stock is 0"
            })
        }

        // check whether the stock is available 


        // fetch the price of the stock

        // check whether the User can buy the given quatity of stock or not


        // if yes then User can buy the stock




    }catch(err){
        console.log("Place user Order error" , err.message),
        res.status(500).json({
            success:false,
            message:"Unable to place Order"
        })
    }
}