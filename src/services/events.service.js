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

  /**
   * Crea un nuevo evento asignando el organizador autenticado
   */
  async createNewEvent(eventData, organizerId) {
    const { title, description, sport_category, date, location, capacity, price } = eventData || {};

    if (!title || !sport_category || !capacity) {
      throw new CustomError('Faltan campos obligatorios para crear el evento deportivo', 400);
    }

    const newEvent = await this.repository.createEvent({
      title: title.trim(),
      description: description ? description.trim() : 'Evento deportivo general',
      sport_category: sport_category.trim(),
      date: date || new Date(),
      location: location ? location.trim() : 'Por definir',
      capacity: Number(capacity),
      price: price ? Number(price) : 0,
      organizer: organizerId,
      status: 'active'
    });

    return newEvent;
  }

  /**
   * Modifica un evento validando propiedad del recurso (organizer solo el suyo, admin cualquiera)
   */
  async updateEvent(eventId, updateData, user) {
    const event = await this.repository.getEventById(eventId);
    if (!event) {
      throw new CustomError('Evento deportivo no encontrado', 404);
    }

    // Validación de propiedad: si no es admin y no es el creador del evento -> 403 Forbidden
    const organizerId = event.organizer ? event.organizer.toString() : null;
    if (user.role !== 'admin' && organizerId !== user.id) {
      throw new CustomError('No tenés permisos para modificar este evento', 403);
    }

    const updatedEvent = await this.repository.updateEvent(eventId, updateData);
    return updatedEvent;
  }

  /**
   * Elimina un evento validando propiedad del recurso
   */
  async deleteEvent(eventId, user) {
    const event = await this.repository.getEventById(eventId);
    if (!event) {
      throw new CustomError('Evento deportivo no encontrado', 404);
    }

    const organizerId = event.organizer ? event.organizer.toString() : null;
    if (user.role !== 'admin' && organizerId !== user.id) {
      throw new CustomError('No tenés permisos para eliminar este evento', 403);
    }

    return await this.repository.deleteEvent(eventId);
  }
}

export default new EventsService();
