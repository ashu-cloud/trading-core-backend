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
    status: {
        type: String,
        enum: ["OPEN", "PARTIAL", "FILLED", "CANCELLED"],
        default: "OPEN"
    },
    filledQuantity: {
        type: Number,
        default: 0
    },

    orderType:{
        type : String,
        enum : ["MARKET" , "LIMIT"],
        default : "LIMIT"
    },
    auditLogs: [
    {
        action: {
        type: String,
        enum: ["CREATED", "PARTIAL_FILL", "FILLED", "CANCELLED"],
        required: true
        },
        quantity: Number,
        price: Number,
        timestamp: {
        type: Date,
        default: Date.now
        }
    }
    ],
    isDeleted: {
    type: Boolean,
    default: false
    }

},{ timestamps : true});


const Order = mongoose.model("Order", orderSchema);

export default Order;