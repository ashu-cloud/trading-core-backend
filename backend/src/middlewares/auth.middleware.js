import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protect = async (req , res, next)=>{
    try{
        const token = req.cookie?.token || req.headers.authorization.split(" ")[1];

        if(!token){
            return res.status(401).json({
                success:false,
                message : "Not Authorized"
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
        return res.status(401).json({
            success:false,
            message: "Invalid or expired Token"
        })
    }
}