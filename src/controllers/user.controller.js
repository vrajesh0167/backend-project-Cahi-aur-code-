import { User } from '../models/user.model.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js'
import uploadOnCloudinary from '../utils/cloudinary.js';

const registerUser = asyncHandler(async (req, res) =>{
    // get user details from frontend
    // validation - not empty
    // check if user already exists : email, username
    // check for image , check for avatar
    // upload them cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user details
    // return res
    
    const {fullName, username, email, password} = req.body;
    console.log("fullName:- ", fullName);

    if([fullName, email, username, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required.")
    }

    const existsUser = await User.findOne({$or: [{username}, {email}]})
    if(existsUser){
        throw new ApiError(409, "User with email or username already exists.")
    }

    const avatarLocalPath =  req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required.");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(400,"Avatar is required.");
    }

    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    const createduser = await User.findById(user._id).select("-password -refreshToken")
    if(!createduser){
        throw new ApiError(500, "something went wrong while registering the user.")
    }

    return res.status(201).json(new ApiResponse(200, createduser, "User Registered Successfully."))
})

export default registerUser;