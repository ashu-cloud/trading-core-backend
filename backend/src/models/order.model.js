import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId:{
        type : mongoose.Schema.Types.ObjectId,
        required : true
    },
    stockSymbol : {
        type : String,
        required : true
    },
    type:{
        type : String,
        enum : ["BUY" , "SELL"],
        required : true
    },
    price : {
        type : Number,
        required : true
    },
    quantity:{
        type : Number,
        required : true
    },
    status:{
        type : String,
        enum : ["OPEN" , "PARTIAL" ,"FILLED"]
    },
    filledQuantity:{
        type : Number,
        default : 0
    },
    orderType:{
        type : String,
        enum : ["MARKET" , "LIMIT"],
        default : "LIMIT"
    }

},{ timestamps : true});


const Order = mongoose.model("Order", orderSchema);

export default Order;