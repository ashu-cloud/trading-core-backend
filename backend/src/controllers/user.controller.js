import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';

export const updateUserProfile = async(req, res)=>{
    try{
        
    const user = await User.findById(req.user._id);

    if(!user){
        return res.status(404).json({
            success:false,
            message: "User Not found"
        })
    }
    
    const {name , profilePic} = req.body;

    if(name && name.trim().length >=2){
        user.name = name.trim();
    }
    if(profilePic){
        user.profilePic = profilePic
    }
    await user.save();

    res.status(200).json({
        success:true,
        message : "Profile Updated Successfully",
        user:{
            _id: user._id,
            email : user.email,
            name : user.name,
            wallet_balance : user.wallet_balance,
            profilePic: user.profilePic,
            createdAt: user.createdAt,
            updatedAt : user.updatedAt
        }
    });

    }catch(err){
        res.status(500).json({
            success:false,
            message: `Error occured in updateUserProfile controller ${err.message}`
        })
    }
}


export const getUserProfile = async(req, res)=>{
    try{

        res.status(200).json({
            success:true,
            user : req.user
        })

    }catch(err){
        res.status(500).json({
            success:false,
            message : `The error occured in getUserProfile controller and the error is ${err.message}`
        })
    }
}


export const updateUserPassword = async(req , res)=>{
    try{

        const {oldPassword , newPassword } = req.body;

        if(!oldPassword || !newPassword){
            return res.status(400).json({
                success:false,
                message: "Old Password and new password are required"
            })
        }

        const user = await User.findById(req.user._id).select("+password");

        if(!user){
            return res.status(404).json({
                success:false,
                message: "User not found"
            })
        }

        if(newPassword.length < 8){
            return res.status(400).json({
                success:false,
                message: "Password must be atleast 8 characters long"
            })
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);

        if(!isMatch){
            return res.status(401).json({
                success:false,
                message : "the Entered Password is not correct try again"
            })
        }
        
        user.password = await bcrypt.hash(newPassword , 10);
        await user.save();

        res.status(200).json({
            success:true,
            message : "Password Updated successfully "
        })

       

    }catch(err){
        return res.status(500).json({
            success:false,
            message : `Error occured in updateUserPassword controller and the error is ${err.message}`
        })
    }
}