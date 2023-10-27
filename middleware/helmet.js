const helmet = require("helmet");

module.exports = (app) => {
  app.use(helmet());
  app.use(helmet.frameguard({ action: "deny" }));
};
