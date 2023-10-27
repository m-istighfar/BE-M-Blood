const applyBodyParser = require("./bodyParser");
const applyHelmet = require("./helmet");
const applyCors = require("./cors");
const applyPermissionPolicy = require("./setPermissionPolicy");

module.exports = (app) => {
  applyHelmet(app);
  applyCors(app);
  applyBodyParser(app);
  applyPermissionPolicy(app);
};
