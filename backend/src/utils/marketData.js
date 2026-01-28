import axios from 'axios'

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

const API_KEY = process.env.FINNHUB_API_KEY;


export const fetchStockPrice = async(symbol)=>{
        const response = await axios.get(
            `${FINNHUB_BASE_URL}/quote`,{
                params : {
                    symbols,
                    token : API_KEY,
                }
            }
        );
        
        
        return response.data.c;
};