const jwt = require("jsonwebtoken");
const { JWT_SIGN } = require("../config/jwt.js");
const cache = require("memory-cache");

const checkRevokedToken = (token) => {
  return cache.get(`blacklist_accessToken_${token}`) === true;
};

const authenticationMiddleware = (req, res, next) => {
  let token;

  if (req.cookies.accessToken) {
    token = req.cookies.accessToken;
  } else if (req.headers.authorization) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (checkRevokedToken(token)) {
    return res.status(401).json({ error: "Token has been revoked" });
  }

  try {
    const decodedToken = jwt.verify(token, JWT_SIGN);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = authenticationMiddleware;
