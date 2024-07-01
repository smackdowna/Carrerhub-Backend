const express = require("express");
const app = express();
const errorMiddleware = require("./middleware/error");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const cors = require("cors");
const NodeCache = require("node-cache");

//config
dotenv.config({ path: "./config/config.env" });

exports.myCache = new NodeCache();
app.use(express.json());
app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(
  cors({
    origin: [],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT"],
  })
);

//Route imports
const user = require("./routes/empRoute.js");
const employeer = require("./routes/employeerRoute.js");
const job = require("./routes/jobsRoute.js");
const admin = require("./routes/adminRoute.js");

app.use("/api/v1", user);
app.use("/api/v1", employeer);
app.use("/api/v1", job);
app.use("/api/v1", admin);

module.exports = app;

app.get("/", (req, res) => res.send(`<h1>Welcome to Carrer Hub</h1>`));

app.get("/api/v1/getkey", (req, res) =>
  res.status(200).json({ key: process.env.RAZORPAY_API_KEY })
);

//middleware
app.use(errorMiddleware);
