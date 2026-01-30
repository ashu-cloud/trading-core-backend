import Portfolio from '../models/portfolio.model.js';
import { fetchStockPrice } from '../utils/marketData.js';

export const getPortfolio = async (req, res)=>{
    try{

        const userId = req.user._id;
        const portfolio = await Portfolio.findOne({user : userId});

        if(!portfolio || portfolio.length === 0){
            return res.status(200).json({
                success : true,
                holdings : [],
                message : "NO holdings Yet"
            })
        }
        
        // Fetch live prices & compute P&L

        const Holdings = await Promise.all(
            portfolio.holding.map(async (h)=>{
                const currentPrice = await fetchStockPrice(h.stockSymbol);

                const unrealizedPnl = (currentPrice - h.avgPrice)*h.quantity;

                return{
                    stockSymbol : h.stockSymbol,
                    quantity : h.quantity,
                    avgPrice : h.avgPrice,
                    currentPrice,
                    unrealizedPnl
                }
            })
        );

        res.status(200).json({
            success:true,
            holdings : Holdings
        })


    }catch(err){
        console.log("Error while fetching portfolio", err.message);
        return res.status(500).json({
            success:false,
            message: "Error while fetching Your Portfolio"
        })
    }
}