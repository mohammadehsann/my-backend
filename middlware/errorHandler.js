const errorHandler = (err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = status === 500 ? "Internal server error" : err.message;
  const data = err.data || null;
  console.error(err);
  res.status(status).json({ message, data });
};

module.exports = { errorHandler };
