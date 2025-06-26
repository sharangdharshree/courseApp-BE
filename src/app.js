import express from "express";
import errorMiddleware from "./middlewares/error.middleware.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(errorMiddleware);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello There, app started");
});

//import routes
import userRouter from "./routes/user.route.js";
// route declaration
app.use("/api/v1/users", userRouter);

export default app;
