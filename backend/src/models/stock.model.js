import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
    name :{
        type : String,
        required : true
    },
    symbol :{
        type : String,
        required : true,
        uppercase : true,
        unique :true,
        index: true
    },
    exchange :{
        type : String,
        required : true
    },
    isTradingHalted :{
        type : Boolean,
        default :false

    },
    price: { type: Number, default: 0 }
}, { timestamps : true })

const Stock = mongoose.model("Stock" , stockSchema);

export default Stock;
