/**
 * DTO para la entidad Ticket / Inscripción
 * Sanitiza las referencias a User y Event evitando exposición de datos sensibles
 */
export class TicketDTO {
  constructor(ticket) {
    if (!ticket) return;
    this.id = ticket._id ? ticket._id.toString() : (ticket.id || null);
    this.reservationCode = ticket.reservationCode || '';
    this.status = ticket.status || 'confirmed';
    this.quantity = typeof ticket.quantity === 'number' ? ticket.quantity : 1;

    // Sanitización de usuario relacionado
    if (ticket.user && typeof ticket.user === 'object' && ticket.user.email) {
      this.user = {
        id: ticket.user._id ? ticket.user._id.toString() : (ticket.user.id || null),
        first_name: ticket.user.first_name || '',
        last_name: ticket.user.last_name || '',
        email: ticket.user.email || ''
      };
    } else if (ticket.user) {
      this.user = ticket.user._id ? ticket.user._id.toString() : ticket.user.toString();
    } else {
      this.user = null;
    }

    // Sanitización de evento relacionado
    if (ticket.event && typeof ticket.event === 'object' && ticket.event.title) {
      this.event = {
        id: ticket.event._id ? ticket.event._id.toString() : (ticket.event.id || null),
        title: ticket.event.title || '',
        category: ticket.event.category || ticket.event.sport_category || '',
        date: ticket.event.date || null,
        location: ticket.event.location || '',
        price: typeof ticket.event.price === 'number' ? ticket.event.price : 0,
        status: ticket.event.status || ''
      };
    } else if (ticket.event) {
      this.event = ticket.event._id ? ticket.event._id.toString() : ticket.event.toString();
    } else {
      this.event = null;
    }

    this.createdAt = ticket.createdAt || null;
    this.cancelledAt = ticket.cancelledAt || null;
  }

  static from(ticket) {
    if (!ticket) return null;
    if (Array.isArray(ticket)) {
      return ticket.map(t => new TicketDTO(t));
    }
    return new TicketDTO(ticket);
  }
}

export default TicketDTO;
