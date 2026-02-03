import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protect = async (req , res, next)=>{
    try{
        let token;
        
        // 1. Try to get token from Cookies (Safe check)
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }
        // 2. Try to get from Header (Safe check)
        else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if(!token){
            return res.status(401).json({
                success:false,
                message : "Not Authorized - No Token"
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        
        if(!user){
            return res.status(401).json({
                success:false,
                message : "User not Found"
            })
        }

        req.user = user;
        next();

    }catch(err){
        // Do not return 500, return 401 for auth failures
        return res.status(401).json({
            success:false,
            message: "Invalid or expired Token"
        })
    }
}