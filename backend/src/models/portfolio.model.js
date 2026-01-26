import mongoose from 'mongoose';

const portfolioSchema = new mongoose.Schema({
    user :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        unique : true,
        required : true
    },
    holding: [{
      stockSymbol : String,
      quantity : Number,
      avgPrice : Number  
    }]

}, {timestamps : true});


const Portfolio = mongoose.model("Portfolio", porfolioSchema);

export default Portfolio;