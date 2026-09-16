import ticketsDao from '../dao/tickets.dao.js';

export class TicketsRepository {
  constructor(dao = ticketsDao) {
    this.dao = dao;
  }

  async createTicket(ticketData) {
    return await this.dao.create(ticketData);
  }

  async getTicketById(id) {
    return await this.dao.getById(id);
  }

  async getTicketsByUser(userId) {
    return await this.dao.getByUser(userId);
  }

  async getTicketsByEvent(eventId) {
    return await this.dao.getByEvent(eventId);
  }

  async getActiveUserTicket(userId, eventId) {
    return await this.dao.getActiveUserTicket(userId, eventId);
  }

  async getOccupiedCapacity(eventId) {
    return await this.dao.getOccupiedCapacity(eventId);
  }

  async updateTicket(id, updateData) {
    return await this.dao.update(id, updateData);
  }

  async cancelTicket(id) {
    return await this.dao.cancel(id);
  }
}

export default new TicketsRepository();
