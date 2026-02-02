import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const SignUp  = async (req , res)=>{
    try{
            if (!req.body) {
                return res.status(400).json({
                    success: false,
                    message: "Request body missing"
            });
            }

        const {name , email , password, wallet_balance=0} = req.body;
  


        if(!name || !email || !password){
            return res.status(400).json({
                success: false,
                message : "Missing input details"
            })
        }

        const isUserAlreadyExists = await User.findOne({email});
        if(isUserAlreadyExists){
            return res.status(409).json({
                succses:false,
                message : "User Already Exists"
            })
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            wallet_balance
        })

        const token = jwt.sign({ id : newUser._id}, process.env.JWT_SECRET,{ expiresIn : "7d"});

        res.cookie("token" , token , {
            httpOnly:true,
            samSite : "strict"
        });

        res.status(201).json({
            success:true,
            message: "User Created Successfully",
            user:{
                _id : newUser._id,
                email : newUser.email,
                wallet_balance : newUser.wallet_balance,
                name:newUser.name
            }
        })

        
    }catch(err){
        res.status(500).json({
            success:false,
            message: `Error in SignUp controller and the error is :${err.message}`
        });
    }
}


export const login = async(req , res)=>{
    try{
        
        const {email , password} = req.body;

        if(!email || !password){
            return res.json({
                success:false,
                message: "Login Details missing"
            })
        }

        const user = await User.findOne({ email }).select("+password");

        if(!user){
            return res.status(400).json({
                success:false,
                message: "Invalid Email or Password"
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if(!isPasswordValid){
            return res.status(401).json({
                success:false,
                message: "Invalid Email or Password"
            })
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn : "7d"});
        res.cookie("token", token,{
            httpPnly: true,
            sameSite : "strict"
        });

        res.status(200).json({
            success:true,
            user :{
                _id: user._id,
                email : email,
                name : user.name,
                token: token
            }
        })

    }catch(err){
        res.status(500).json({
            success:false,
            message : `Error occured in Login Controller and the error is :${err.message}`
        })
    }
}


export const getMe = async (req , res)=>{
    res.status(200).json({
        success:true,
        user:req.user
    })
}



export const logout = async(req , res)=>{
    try{

        res.clearCookie("token");

        return res.status(200).json({
            success:true,
            message : "User logged out successfully "
        });


    }catch(err){
        console.log('Not able to logout due to :' , err.message);
        return res.status(500).json({
            success:false,
            message : "Not able to Logout "
        })
    }
}

