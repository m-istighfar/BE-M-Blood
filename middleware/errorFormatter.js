function errorFormatter(err, req, res, next) {
  if (err.message && err.errors) {
    return res.status(err.status || 400).json({
      error: err.message,
    });
  }

  if (err.error) {
    return res.status(err.status || 400).json({
      error: err.error,
    });
  }

  return res.status(500).json({
    error: "Internal Server Error",
  });
}

module.exports = errorFormatter;
