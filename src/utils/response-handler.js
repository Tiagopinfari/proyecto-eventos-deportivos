export const successResponse = (res, payload = [], message = 'Operación exitosa', statusCode = 200) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    payload
  });
};

export const errorResponse = (res, message = 'Ocurrió un error en el servidor', statusCode = 500) => {
  return res.status(statusCode).json({
    status: 'error',
    message
  });
};
