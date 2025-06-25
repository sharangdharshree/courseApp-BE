import "dotenv/config";
import connectDB from "./db/db.js";
import app from "./app.js";

connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("Express is not able to communicate with DB: ", error);
    });

    app.listen(process.env.PORT || 8000, () => {
      console.log(`server is running at port: ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection failed: ", err);
  });
