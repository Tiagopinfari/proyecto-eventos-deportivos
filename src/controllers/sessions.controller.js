/**
 * Controladores iniciales para el recurso de Sesiones / Autenticación
 * Estructura base para futuras entregas (Login, Registro, Current session)
 */

export const register = async (req, res) => {
  return res.status(501).json({
    status: 'info',
    message: 'Funcionalidad de registro pendiente para entrega de Autenticación'
  });
};

export const login = async (req, res) => {
  return res.status(501).json({
    status: 'info',
    message: 'Funcionalidad de inicio de sesión pendiente para entrega de Autenticación'
  });
};

export const getSessionStatus = async (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Estructura inicial de sesiones lista'
  });
};
