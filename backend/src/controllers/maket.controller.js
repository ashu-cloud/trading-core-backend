import {fetchStockPrice} from '../utils/marketData.js'
import Stock from '../models/stock.model.js'

export const getStockPrice = async(req, res)=>{
    try{

        

    }catch(err){
        return res.status(500).json({
            success:false,
            message :  `Could not fetch the Stock Price ${err.message}`
        })
    }
}