import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { DB_ATLAS_URL } from "../config/index.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${DB_ATLAS_URL}/${DB_NAME}`);
        console.log(`MongoDB connected !! : DB HOST : ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MONGODB connection error", error);
        process.exit(1);
    }
};

export default connectDB;