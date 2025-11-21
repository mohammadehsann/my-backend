let io;

module.exports = {
  init: (httpServer) => {
    io = require("socket.io")(httpServer, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        credentials: true,
      },
    });
    return io;
  },

  getIo: () => {
    if (!io) {
      throw new Error("socket.io is not initialized");
    }
    return io;
  },
};
