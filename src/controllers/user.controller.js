import mongoose from "mongoose";
import { REFRESH_TOKEN_SECRET } from "../config/index.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

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
        $or: [{ username }, { email }],
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

const refreshAccessToken = asyncHandler(async (req, res) => {
    const inCommingAccessToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!inCommingAccessToken) {
        throw new ApiError(401, "Unauthorized Token");
    }

    const decodedToken = jwt.verify(inCommingAccessToken, REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id);
    if (!user) {
        throw new ApiError(401, "Invalid token");
    }

    if (inCommingAccessToken !== user.refreshToken) {
        throw new ApiError(401, "Refresh Token is expired or used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
        user._id
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
                { accessToken, refreshToken },
                "Access Token refreshed"
            )
        );
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    const checkPassword = await user.isPasswordCorrent(oldPassword);
    if (!checkPassword) {
        throw new ApiError(403, "Invalid Password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select(
        "-password -refreshToken"
    );
    if (!user) {
        throw new ApiError(
            500,
            "something went wrong while fetching the user."
        );
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "User Fetched Successfully"));
});

const UpdateUserDocuments = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { fullName, email } },
        { new: true }
    ).select("-password");

    if (!user) {
        throw new ApiError(
            500,
            "something went wrong while updating the user."
        );
    }
    return res.status(200).json(200, user, "User Updated Successfully");
});

const changeAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar.url) {
        throw new ApiError(400, "Avatar is required.");
    }

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password");

    return res.status(200).json(200, user, "Avatar updated Successfully");
});
const changeCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImage.url) {
        throw new ApiError(400, "coverImage is required.");
    }

    const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password");

    return res.status(200).json(200, user, "coverImage updated Successfully");
});

const getUserChannelProfile = async (req, res, next) => {
    const { username } = req.params;

    if (!username?.trim()) {
        return next(new ApiError(400, "Username is notfound."));
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subcriber",
                as: "subscribed",
            },
        },
        {
            $addFields: {
                subscribers: {
                    $size: "$subscribers",
                },
                subscribed: {
                    $size: "$subscribed",
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subcriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribers: 1,
                subscribed: 1,
                isSubscribed: 1,
            },
        },
    ]);

    if (!channel?.length) {
        return next(new ApiError(404, "Channel does not exist"));
    }

    return res
        .status(200)
        .json(200, channel[0], "Channel Fetched Successfully");
};

const getwatchHistory = asyncHandler(async (req, res, next) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        email: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "Watch History fetched successfully"
            )
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentUserPassword,
    getCurrentUser,
    UpdateUserDocuments,
    changeAvatar,
    changeCoverImage,
    getUserChannelProfile,
    getwatchHistory,
};
