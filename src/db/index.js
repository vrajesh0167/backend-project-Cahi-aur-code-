import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
import { DB_ATLAS_URL } from "../config/index.js";

const connectDB = async () => {
    try {
        await mongoose.connect(DB_ATLAS_URL,{
            dbName: DB_NAME,
        }).then(() => {
            console.log("MongoDB Connected...");
        }).catch((err) => {
            console.log(err.message);
        });
        // console.log(`MongoDB connected !! : DB HOST : ${connectionInstance.connection.host}`);

    } catch (error) {
        console.log("MONGODB connection error:- ", error);
        process.exit(1);
    }
};

export default connectDB;