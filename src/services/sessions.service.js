import usersRepository from '../repositories/users.repository.js';
import CustomError from '../utils/custom-error.js';

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

  async registerUser(userData) {
    const existingUser = await this.repository.getUserByEmail(userData.email);
    if (existingUser) {
      throw new CustomError('El correo electrónico ya se encuentra registrado', 400);
    }
    return await this.repository.createUser(userData);
  }
}

export default new SessionsService();
