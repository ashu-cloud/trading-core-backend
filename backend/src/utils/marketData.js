import dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

const API_KEY = process.env.FINNHUB_API_KEY;

console.log("FINNHUB API KEY:" , API_KEY);

export const fetchStockPrice = async(symbol)=>{
        const response = await axios.get(
            `${FINNHUB_BASE_URL}/quote`,{
                params : {
                    symbol,
                    token : API_KEY,
                }
            }
        );
        
        
        return response.data.c;
};


export const fetchAllStocks = async (exchange = "US")=>{
    const response  = await axios.get(
        `${FINNHUB_BASE_URL}/stock/symbol`,{
            params:{
                exchange ,
                token : API_KEY,
            }
        }
    )

    return response.data;
}