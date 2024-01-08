import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const generateAccessAndRefreshTokens = async (userid) => {
    try {
        const user = await User.findById(userid);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "something went wrong while generate access and refresh token"
        );
    }
};

// register user
const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists : email, username
    // check for image , check for avatar
    // upload them cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user details
    // return res

    const { fullName, username, email, password } = req.body;
    // console.log("fullName:- ", fullName);

    if (
        [fullName, email, username, password].some(
            (field) => field?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required.");
    }

    const existsUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existsUser) {
        throw new ApiError(409, "User with email or username already exists.");
    }

    // console.log(req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if (
        req.files &&
        Array.isArray(req.files.coverImage) &&
        req.files.coverImage.length > 0
    ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required.");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Avatar is required.");
    }

    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });

    const createduser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    if (!createduser) {
        throw new ApiError(
            500,
            "something went wrong while registering the user."
        );
    }

    return res
        .status(201)
        .json(
            new ApiResponse(200, createduser, "User Registered Successfully.")
        );
});

// logIn user
const loginUser = asyncHandler(async (req, res) => {
    // req.body => deta
    // username or email
    // find the user
    // password check
    // access and refresh token
    // res cookie

    const { username, email, password } = req.body;
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "Username or Email field is required");
    }

    //username & Email any one use
    // if (!(username || email)) {
    //     throw new ApiError(400, "Username or Email field is required");
    // }

    const user = await User.findOne({
        $or: [{username}, {email }] 
    });
    if (!user) {
        throw new ApiError(404, "User Not Found");
    }

    const checkPassword = await user.isPasswordCorrent(password);
    if (!checkPassword) {
        throw new ApiError(403, "Invalid Password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const option = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, option)
        .cookie("refreshToken", refreshToken, option)
        .json(
            new ApiResponse(
                200,
                { user: loggedInUser, accessToken, refreshToken },
                "User logged In Successfully"
            )
        );
});

// logOut user
const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $set: { refreshToken: undefined } },
        { new: true }
    );

    const option = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", option)
        .clearCookie("refreshToken", option)
        .json(new ApiResponse(200, {}, "User logged out"));
});

export { registerUser, loginUser, logoutUser };
