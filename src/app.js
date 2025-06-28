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

//import routes
import userRouter from "./routes/user.route.js";
import publicRouter from "./routes/public.route.js";
import adminRouter from "./routes/admin.route.js";
import courseRouter from "./routes/course.route.js";
// route declaration
app.use("/api/v1/user", userRouter);
app.use("/api/v1/public", publicRouter);
app.use("/api/v1/admin", adminRouter);
app.use("api/v1/course", courseRouter);

export default app;
