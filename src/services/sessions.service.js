import usersRepository from '../repositories/users.repository.js';
import CustomError from '../utils/custom-error.js';
import { createHash } from '../utils/hash.js';

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

    // 1. Validar presencia de campos obligatorios
    if (!first_name || !last_name || !email || !password) {
      throw new CustomError('Faltan campos obligatorios', 400);
    }

    // 2. Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      throw new CustomError('Formato de email inválido', 400);
    }

    // 3. Validar longitud de la contraseña
    if (password.length < 6) {
      throw new CustomError('La contraseña debe tener al menos 6 caracteres', 400);
    }

    // 4. Normalizar email (trim + lowercase)
    const normalizedEmail = email.trim().toLowerCase();

    // 5. Verificar si el email ya se encuentra registrado
    const existingUser = await this.repository.getUserByEmail(normalizedEmail);
    if (existingUser) {
      throw new CustomError('El email ya está registrado', 409);
    }

    // 6. Hashear la contraseña utilizando bcrypt
    const hashedPassword = createHash(password);

    // 7. Forzar el rol a 'user' (no manipulable por el body público)
    const newUserData = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: 'user'
    };

    const savedUser = await this.repository.createUser(newUserData);

    // 8. Retornar payload sanitizado sin contraseña
    return {
      id: savedUser._id ? savedUser._id.toString() : savedUser.id,
      first_name: savedUser.first_name,
      last_name: savedUser.last_name,
      email: savedUser.email,
      role: savedUser.role
    };
  }
}

export default new SessionsService();
