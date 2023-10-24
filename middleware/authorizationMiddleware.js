const jwt = require("jsonwebtoken");
const { JWT_SIGN } = require("../config/jwt.js");

const authorizationMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    let token;

    if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
    } else if (req.headers.authorization) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const decodedToken = jwt.verify(token, JWT_SIGN);

      if (allowedRoles.includes(decodedToken.role)) {
        next();
      } else {
        res.status(401).json({ error: "Unauthorized" });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };
};

module.exports = authorizationMiddleware;
