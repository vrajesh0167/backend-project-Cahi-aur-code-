import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { CORS_DATA } from "./config/index.js";

const app = express();

app.use(
    cors({
        origin: CORS_DATA,
        credentials: true,
    })
);
app.use(cookieParser());
app.use(express.json({ limit: "16kb" })); // To get json data from server
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // to get url data from url
app.use(express.static("public"));

export default app;
