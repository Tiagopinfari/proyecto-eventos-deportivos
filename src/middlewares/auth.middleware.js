import passport from 'passport';

/**
 * Middleware wrapper personalizado para invocar estrategias de Passport.js
 * y estandarizar las respuestas JSON y códigos de estado HTTP requeridos.
 * @param {string} strategy - Nombre de la estrategia ('register', 'login', 'current')
 */
export const passportCall = (strategy) => {
  return (req, res, next) => {
    passport.authenticate(strategy, { session: false }, (err, user, info) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        const message = info?.message || 'No autenticado';

        // Manejo específico de códigos HTTP para la estrategia register
        if (strategy === 'register') {
          if (message === 'El email ya está registrado') {
            return res.status(409).json({
              status: 'error',
              message
            });
          }
          return res.status(400).json({
            status: 'error',
            message
          });
        }

        // Manejo específico de códigos HTTP para la estrategia login
        if (strategy === 'login') {
          return res.status(401).json({
            status: 'error',
            message: 'Credenciales inválidas'
          });
        }

        // Manejo específico de códigos HTTP para la estrategia current
        if (strategy === 'current') {
          return res.status(401).json({
            status: 'error',
            message: 'No autenticado'
          });
        }

        return res.status(401).json({
          status: 'error',
          message
        });
      }

      req.user = user;
      return next();
    })(req, res, next);
  };
};

export default passportCall;
