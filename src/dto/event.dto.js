/**
 * DTO para la entidad Evento Deportivo
 * Normaliza campos y filtra el objeto organizador si viene populado
 */
export class EventDTO {
  constructor(event) {
    if (!event) return;
    this.id = event._id ? event._id.toString() : (event.id || null);
    this.title = event.title || '';
    this.description = event.description || '';
    this.category = event.category || event.sport_category || '';
    this.date = event.date || null;
    this.location = event.location || '';
    this.capacity = typeof event.capacity === 'number' ? event.capacity : 0;
    this.price = typeof event.price === 'number' ? event.price : 0;
    this.status = event.status || 'published';

    // Sanitización del organizador (si viene populado como objeto de usuario)
    if (event.organizer && typeof event.organizer === 'object' && event.organizer.email) {
      this.organizer = {
        id: event.organizer._id ? event.organizer._id.toString() : (event.organizer.id || null),
        first_name: event.organizer.first_name || '',
        last_name: event.organizer.last_name || '',
        email: event.organizer.email || ''
      };
    } else if (event.organizer) {
      this.organizer = event.organizer._id ? event.organizer._id.toString() : event.organizer.toString();
    } else {
      this.organizer = null;
    }

    this.createdAt = event.createdAt || null;
    this.updatedAt = event.updatedAt || null;
  }

  static from(event) {
    if (!event) return null;
    if (Array.isArray(event)) {
      return event.map(e => new EventDTO(e));
    }
    return new EventDTO(event);
  }
}

export default EventDTO;
