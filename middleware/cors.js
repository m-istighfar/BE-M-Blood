const cors = require("cors");

module.exports = (app) => {
  const allowedOrigins = ["http://localhost:5173", "http://127.0.0.1:5500"];

  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  };

  app.use(cors(corsOptions));
};
