import express from "express";
import {
    UpdateUserDocuments,
    changeAvatar,
    changeCoverImage,
    changeCurrentUserPassword,
    getCurrentUser,
    getUserChannelProfile,
    getwatchHistory,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentUserPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, UpdateUserDocuments);
router
    .route("/change-avatat")
    .patch(verifyJWT, upload.single("avatar"), changeAvatar);
router
    .route("/change-coverImage")
    .patch(verifyJWT, upload.single("coverImage"), changeCoverImage);
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getwatchHistory);

export default router;
