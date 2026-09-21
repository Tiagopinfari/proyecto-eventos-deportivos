import usersRepository from '../repositories/users.repository.js';
import UserDTO from '../dto/user.dto.js';
import CustomError from '../utils/custom-error.js';

export class UsersService {
  constructor(repository = usersRepository) {
    this.repository = repository;
  }

  /**
   * Obtiene todos los usuarios formateados mediante UserDTO (sin passwords)
   */
  async getAllUsers(filter = {}) {
    const users = await this.repository.getUsers(filter);
    return UserDTO.from(users);
  }

  /**
   * Obtiene un usuario por ID mediante UserDTO
   */
  async getUserById(id) {
    const user = await this.repository.getUserById(id);
    if (!user) {
      throw new CustomError('Usuario no encontrado', 404);
    }
    return UserDTO.from(user);
  }

  /**
   * Obtiene un usuario por email
   */
  async getUserByEmail(email) {
    const user = await this.repository.getUserByEmail(email);
    return user;
  }
}

export default new UsersService();
