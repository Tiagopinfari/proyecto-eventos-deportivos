import eventsRepository from '../repositories/events.repository.js';
import CustomError from '../utils/custom-error.js';

export class EventsService {
  constructor(repository = eventsRepository) {
    this.repository = repository;
  }

  async fetchAllEvents(filter = {}) {
    return await this.repository.getEvents(filter);
  }

  async fetchEventById(id) {
    const event = await this.repository.getEventById(id);
    if (!event) {
      throw new CustomError(`Evento deportivo con ID ${id} no encontrado`, 404);
    }
    return event;
  }

  async createNewEvent(eventData) {
    if (!eventData.title || !eventData.sport_category || !eventData.capacity) {
      throw new CustomError('Faltan campos obligatorios para crear el evento deportivo', 400);
    }
    return await this.repository.createEvent(eventData);
  }
}

export default new EventsService();
