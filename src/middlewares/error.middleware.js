import { errorResponse } from '../utils/response-handler.js';

export const errorHandlerMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  console.error(`[Error Handler] HTTP ${statusCode}: ${message}`);
  return errorResponse(res, message, statusCode);
};

export default errorHandlerMiddleware;
