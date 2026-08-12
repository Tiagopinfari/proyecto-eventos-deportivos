import usersRepository from '../repositories/users.repository.js';
import CustomError from '../utils/custom-error.js';
import { createHash, isValidPassword } from '../utils/hash.js';
import { generateToken } from '../utils/jwt.js';

export class SessionsService {
  constructor(repository = usersRepository) {
    this.repository = repository;
  }

  async getSessionModuleStatus() {
    return {
      status: 'active',
      module: 'sessions',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Registra un nuevo usuario aplicando validaciones, normalización y hash de contraseña
   * @param {Object} userData - Datos enviados en la solicitud HTTP
   * @returns {Object} Usuario registrado sanitizado (sin contraseña)
   */
  async registerUser(userData) {
    const { first_name, last_name, email, password } = userData || {};

    if (!first_name || !last_name || !email || !password) {
      throw new CustomError('Faltan campos obligatorios', 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new CustomError('Formato de email inválido', 400);
    }

    if (password.length < 6) {
      throw new CustomError('La contraseña debe tener al menos 6 caracteres', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await this.repository.getUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new CustomError('El email ya está registrado', 409);
    }

    const hashedPassword = createHash(password);

    const newUserData = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user'
    };

    const savedUser = await this.repository.createUser(newUserData);

    return {
      id: savedUser._id ? savedUser._id.toString() : savedUser.id,
      first_name: savedUser.first_name,
      last_name: savedUser.last_name,
      email: savedUser.email,
      role: savedUser.role
    };
  }

  /**
   * Autentica a un usuario y genera su token JWT
   * @param {Object} credentials - Objeto con email y password
   * @returns {Object} Objeto con token JWT generado
   */
  async loginUser(credentials) {
    const { email, password } = credentials || {};

    if (!email || !password) {
      throw new CustomError('Credenciales inválidas', 401);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.repository.getUserByEmail(normalizedEmail);

    if (!user) {
      throw new CustomError('Credenciales inválidas', 401);
    }

    const validPassword = isValidPassword(password, user.password);
    if (!validPassword) {
      throw new CustomError('Credenciales inválidas', 401);
    }

    const userId = user._id ? user._id.toString() : user.id;

    const token = generateToken({
      id: userId,
      email: user.email,
      role: user.role
    });

    return {
      token,
      user: {
        id: userId,
        email: user.email,
        role: user.role
      }
    };
  }

  /**
   * Retorna la información segura del usuario autenticado en la sesión actual
   * @param {Object} user - Usuario decodificado del JWT
   * @returns {Object} Payload seguro ({ id, email, role })
   */
  getCurrentUserPayload(user) {
    if (!user) {
      throw new CustomError('No autenticado', 401);
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role
    };
  }
}

export default new SessionsService();
