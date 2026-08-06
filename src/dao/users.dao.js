import UserModel from '../models/User.js';

export class UsersDao {
  async getAll(filter = {}) {
    return await UserModel.find(filter).lean();
  }

  async getById(id) {
    return await UserModel.findById(id).lean();
  }

  async getByEmail(email) {
    return await UserModel.findOne({ email }).lean();
  }

  async create(userData) {
    return await UserModel.create(userData);
  }

  async update(id, userData) {
    return await UserModel.findByIdAndUpdate(id, userData, { new: true }).lean();
  }

  async delete(id) {
    return await UserModel.findByIdAndDelete(id).lean();
  }
}

export default new UsersDao();
