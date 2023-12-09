import connectDB from "./db/index.js";
import app from "./app.js";
import { APP_PORT } from "./config/index.js";

connectDB()
.then(
    app.listen(APP_PORT || 4000 , () =>{
        console.log(`Server is rinnong on port ${APP_PORT}`);
    })
)
.catch((err) =>{
    console.log("Mongo DB connection Error", err);
});
