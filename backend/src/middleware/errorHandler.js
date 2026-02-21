/**
 * Central error handling: 401 Unauthorized, 403 Forbidden, 500 Internal Server Error
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';
  let code = 'INTERNAL_ERROR';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = Object.values(err.errors).map(e => e.message).join(', ');
  }
  if (err.code === 11000) {
    statusCode = 400;
    code = 'DUPLICATE';
    message = 'Duplicate field value';
  }
  if (err.name === 'JsonWebTokenError' || err.code === 'UNAUTHORIZED') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = message || 'Invalid or missing token';
  }
  if (err.code === 'FORBIDDEN') {
    statusCode = 403;
    code = 'FORBIDDEN';
    message = message || 'Access denied';
  }
  if (statusCode === 500) code = 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
