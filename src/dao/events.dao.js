import EventModel from '../models/Event.js';

export class EventsDao {
  async getAll(filter = {}) {
    return await EventModel.find(filter).lean();
  }

  async getById(id) {
    return await EventModel.findById(id).lean();
  }

  async create(eventData) {
    return await EventModel.create(eventData);
  }

  async update(id, eventData) {
    return await EventModel.findByIdAndUpdate(id, eventData, { new: true }).lean();
  }

  async delete(id) {
    return await EventModel.findByIdAndDelete(id).lean();
  }
}

export default new EventsDao();
