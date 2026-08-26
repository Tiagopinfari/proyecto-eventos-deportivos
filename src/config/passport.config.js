import passport from 'passport';
import local from 'passport-local';
import jwt from 'passport-jwt';
import config from './config.js';
import usersRepository from '../repositories/users.repository.js';
import { createHash, isValidPassword } from '../utils/hash.js';

const LocalStrategy = local.Strategy;
const JWTStrategy = jwt.Strategy;
const ExtractJwt = jwt.ExtractJwt;

/**
 * Extractor personalizado para obtener el JWT desde la cookie 'currentUser'
 */
const cookieExtractor = (req) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies.currentUser;
  }
  return token;
};

/**
 * Inicialización centralizada de todas las estrategias de Passport.js
 */
export const initializePassport = () => {
  // ==========================================
  // 1. ESTRATEGIA DE REGISTRO LOCAL
  // ==========================================
  passport.use(
    'register',
    new LocalStrategy(
      {
        passReqToCallback: true,
        usernameField: 'email'
      },
      async (req, username, password, done) => {
        try {
          const { first_name, last_name } = req.body || {};

          // Validación de presencia de campos
          if (!first_name || !last_name || !username || !password) {
            return done(null, false, { message: 'Faltan campos obligatorios' });
          }

          // Validación de formato de email
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(username.trim())) {
            return done(null, false, { message: 'Formato de email inválido' });
          }

          // Validación de longitud de contraseña
          if (password.length < 6) {
            return done(null, false, { message: 'La contraseña debe tener al menos 6 caracteres' });
          }

          const normalizedEmail = username.trim().toLowerCase();

          // Verificación de email duplicado
          const existingUser = await usersRepository.getUserByEmail(normalizedEmail);
          if (existingUser) {
            return done(null, false, { message: 'El email ya está registrado' });
          }

          // Hasheo seguro de la contraseña
          const hashedPassword = createHash(password);

          // Creación de usuario forzando el rol seguro 'user'
          const newUser = await usersRepository.createUser({
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            role: 'user'
          });

          return done(null, newUser);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // ==========================================
  // 2. ESTRATEGIA DE LOGIN LOCAL
  // ==========================================
  passport.use(
    'login',
    new LocalStrategy(
      {
        usernameField: 'email'
      },
      async (username, password, done) => {
        try {
          if (!username || !password) {
            return done(null, false, { message: 'Credenciales inválidas' });
          }

          const normalizedEmail = username.trim().toLowerCase();
          const user = await usersRepository.getUserByEmail(normalizedEmail);

          if (!user) {
            return done(null, false, { message: 'Credenciales inválidas' });
          }

          const validPassword = isValidPassword(password, user.password);
          if (!validPassword) {
            return done(null, false, { message: 'Credenciales inválidas' });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // ==========================================
  // 3. ESTRATEGIA CURRENT (JWT & COOKIES)
  // ==========================================
  passport.use(
    'current',
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([
          cookieExtractor,
          ExtractJwt.fromAuthHeaderAsBearerToken()
        ]),
        secretOrKey: config.jwtSecret
      },
      async (jwt_payload, done) => {
        try {
          if (!jwt_payload) {
            return done(null, false, { message: 'No autenticado' });
          }
          return done(null, jwt_payload);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // =========================================================================
  // PREPARACIÓN PARA FUTURAS ESTRATEGIAS EXTERNAS (ej. Google, GitHub, etc.)
  // Para agregar nuevas estrategias de OAuth basta con declararlas aquí sin
  // necesidad de modificar app.js ni la estructura general del proyecto.
  // =========================================================================
};

export default initializePassport;
