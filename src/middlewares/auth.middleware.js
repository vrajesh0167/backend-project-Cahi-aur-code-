import { ACCESS_TOKEN_SECRET } from "../config/index.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("bearer ", "");
    
        if (!token) {
            throw new ApiError(201, "Unauthorized request");
        }
    
        const decodedTOken = jwt.verify(token, ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedTOken._id).select(
            "-password -refreshToken"
        );
    
        if (!user) {
            throw new ApiError(404, "Invalied Access Token");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(error.message || "Invalied Access Token")
    }
});
