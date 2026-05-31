import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If response headers have already been sent, delegate to the default Express handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Sanitize req.body for logs (hide secrets/passwords)
  const sanitizedBody = { ...req.body };
  if (sanitizedBody.password) sanitizedBody.password = '******';
  if (sanitizedBody.currentPassword) sanitizedBody.currentPassword = '******';
  if (sanitizedBody.newPassword) sanitizedBody.newPassword = '******';

  // Log error using our structured logger
  logger.error(
    `[Route Exception] ${req.method} ${req.originalUrl} | Status: ${statusCode} | IP: ${req.ip} | Body: ${JSON.stringify(sanitizedBody)}`,
    err
  );

  // Send clean, secure JSON error response
  res.status(statusCode).json({
    success: false,
    error: statusCode === 500 && !isDevelopment
      ? 'An unexpected internal server error occurred.'
      : err.message || 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack })
  });
};

export default errorHandler;
