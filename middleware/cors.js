const cors = require("cors");

module.exports = (app) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "https://fe-final-project-revou.vercel.app",
  ];

  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  };

  app.use(cors());
};
