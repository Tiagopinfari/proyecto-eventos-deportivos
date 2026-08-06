import usersDao from '../dao/users.dao.js';

export class UsersRepository {
  constructor(dao = usersDao) {
    this.dao = dao;
  }

  async getUsers(filter) {
    return await this.dao.getAll(filter);
  }

  async getUserById(id) {
    return await this.dao.getById(id);
  }

  async getUserByEmail(email) {
    return await this.dao.getByEmail(email);
  }

  async createUser(userData) {
    return await this.dao.create(userData);
  }

  async updateUser(id, userData) {
    return await this.dao.update(id, userData);
  }

  async deleteUser(id) {
    return await this.dao.delete(id);
  }
}

export default new UsersRepository();
