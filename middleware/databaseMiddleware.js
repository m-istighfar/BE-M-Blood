const mongoose = require("mongoose");

const DB_URL = process.env.DB_URL;

const databaseMiddleware = (req, res, next) => {
  try {
    mongoose.connect(`${DB_URL}`, {
      useNewUrlParser: true,

      useUnifiedTopology: true,
    });
    console.log("Connected to the database.");
    next();
  } catch (error) {
    console.error("Error connecting to the database:", error);
  }
};

module.exports = databaseMiddleware;
