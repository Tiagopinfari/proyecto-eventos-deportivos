import eventsDao from '../dao/events.dao.js';

export class EventsRepository {
  constructor(dao = eventsDao) {
    this.dao = dao;
  }

  async getPaginatedEvents({ filter, page, limit, sort }) {
    return await this.dao.getPaginated({ filter, page, limit, sort });
  }

  async getEvents(filter) {
    return await this.dao.getAll(filter);
  }

  async getEventById(id) {
    return await this.dao.getById(id);
  }

  async createEvent(eventData) {
    return await this.dao.create(eventData);
  }

  async updateEvent(id, eventData) {
    return await this.dao.update(id, eventData);
  }

  async softDeleteEvent(id) {
    return await this.dao.softDelete(id);
  }

  async deleteEvent(id) {
    return await this.dao.delete(id);
  }
}

export default new EventsRepository();
