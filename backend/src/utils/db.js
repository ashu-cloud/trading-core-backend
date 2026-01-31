import mongoose from 'mongoose';

const DB = async()=>{
    try{

        const conn = await mongoose.connect(
            `${process.env.MONGODB_URI}/stock-app`
        )

        console.log(`MongoDb Connected `);
        

    }catch(err){
        console.error("MongoDB connection failed:", err.message);
        process.exit(1);
    }
}

mongoose.connection.on("error", (err)=>{
            console.error("MongoDB error :" , err);
        });

export default DB;