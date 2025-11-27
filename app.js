const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const compression = require("compression");
const authRoutes = require("./routes/auth");
const feedRoutes = require("./routes/feed");
const { errorHandler } = require("./middlware/errorHandler");
const connectServer = require("./config/db");

dotenv.config();
const app = express();
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);
app.use(errorHandler);

connectServer(app);
