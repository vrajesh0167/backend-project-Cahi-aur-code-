import dotenv from "dotenv";

dotenv.config();

export const {
    APP_PORT,
    DB_ATLAS_URL,
    CORS_DATA,
    ACCESS_TOKEN_SECRET,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_SECRET,
    REFRESH_TOKEN_EXPIRY,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SCRECT,
} = process.env;
