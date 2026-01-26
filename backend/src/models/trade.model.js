import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
    buyOrderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref : "Order",
        required:true
    },
    sellOrderId:{
        type: mongoose.Schema.Types.ObjectId,
        ref : "Order",
        required : true
    },
    stockSymbol:{
        type:String,
        required:true,
    },
    price :{
        type : Number,
        required: true,
    },
    quantity:{
        type : Number,
        required : true
    },

}, {timestamps : true})

const Trade = mongoose.model('Trade' , tradeSchema);

export default Trade;