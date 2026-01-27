import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';

export const updateUserProfile = async(req, res)=>{
    try{
        const {name , email , password , wallet_balance} = req.body;

        const userId = req.user._id;

        let updateUser;

    }catch(err){
        res.status(500).json({
            success:false,
            message: `Error occured in updateUserProfile controller ${err.message}`
        })
    }
}