const mongoose = require("mongoose");
const port = process.env.PORT || 5000;

const connectServer = async (app) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    const server = app.listen(port);
    const io = require("../socket-io").init(server);
    io.on("connection", (socket) => {
      console.log("client connected");
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected successfully");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error:", err);
  });

  mongoose.connection.on("disconnected", () => {
    console.log("MongoDB disconnected");
  });
};
module.exports = connectServer;
