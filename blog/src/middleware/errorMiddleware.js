function notFound(req, res) {
  res.status(404).json({ message: `接口不存在: ${req.originalUrl}` });
}

function errorHandler(error, req, res, next) {
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

  res.status(statusCode).json({
    message: error.message || '服务器内部错误',
  });
}

module.exports = {
  notFound,
  errorHandler,
};
