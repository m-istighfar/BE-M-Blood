const morgan = require("morgan");
const fs = require("fs");
const path = require("path");
const rfs = require("rotating-file-stream");

module.exports = (app) => {
  const accessLogStream = rfs.createStream("request.log", {
    interval: "1d",
    path: path.join(__dirname, "../logger"),
    size: "10M",
    maxFiles: 5,
  });

  app.use(morgan("combined", { stream: accessLogStream }));
};
