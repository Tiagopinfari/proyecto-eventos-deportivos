/**
 * Middleware de autorización basado en roles.
 * Compara el rol del usuario autenticado en req.user contra los roles permitidos.
 * Si no está autenticado devuelve 401. Si el rol no tiene permiso devuelve 403.
 * @param {string[]|string} roles - Rol o array de roles autorizados ('admin', 'organizer', 'user')
 */
export const authorize = (roles = []) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    // 1. Si no hay usuario autenticado en la petición -> 401 Unauthorized
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'No autenticado'
      });
    }

    // 2. Si el rol del usuario no se encuentra entre los roles permitidos -> 403 Forbidden
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'No tenés permisos para realizar esta acción'
      });
    }

    return next();
  };
};

export default authorize;
