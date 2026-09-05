/** 404 handler for unknown routes. */
export function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

/** Central error handler. Keeps error responses consistent across the API. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error('💥 Error:', err.message);

  // Mongoose duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({ message: `That ${field} is already in use.` });
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(' ') });
  }

  // Multer (file upload) errors
  if (err.name === 'MulterError') {
    const msg =
      err.code === 'LIMIT_FILE_SIZE' ? 'That file is too large (max 8 MB for images, 20 MB for documents).' : `Upload error: ${err.message}`;
    return res.status(400).json({ message: msg });
  }
  if (/^Only .* files are allowed\.$/.test(err.message || '')) {
    return res.status(400).json({ message: err.message });
  }

  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({
    message: err.message || 'Something went wrong.',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}
