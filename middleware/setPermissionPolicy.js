module.exports = (app) => {
  app.use((req, res, next) => {
    res.setHeader("Permissions-Policy", "geolocation=self");
    next();
  });
};
