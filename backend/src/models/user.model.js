import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name :{
        type : String,
        required : true
    },
    email:{
        type:String,
        required : true,
        unique : true,
        index : true,
        lowercase : true
    },
    password:{
        type : String,
        required: true,
        select:false
    },
    wallet_balance:{
        type :Number,
        required : true,
        default : 0
    },
    profilePic:{
        type :String,
        default :""
    }
}, {timestamps : true})

const User = mongoose.model("User" , userSchema);

export default User;