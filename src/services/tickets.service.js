import ticketsRepository from '../repositories/tickets.repository.js';
import eventsRepository from '../repositories/events.repository.js';
import mailService from './mail.service.js';
import CustomError from '../utils/custom-error.js';

export class TicketsService {
  constructor(
    repository = ticketsRepository,
    eventsRepo = eventsRepository,
    mailer = mailService
  ) {
    this.repository = repository;
    this.eventsRepo = eventsRepo;
    this.mailer = mailer;
  }

  /**
   * Genera un código de reserva legible y único (ej: TK-A1B2-C3D4)
   */
  _generateReservationCode() {
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Date.now().toString(36).slice(-4).toUpperCase();
    return `TK-${part1}-${part2}`;
  }

  /**
   * Crea una inscripción / ticket para un evento validando cupos y duplicados
   */
  async createTicket({ eventId, user, quantity = 1 }) {
    if (!eventId) {
      throw new CustomError('El ID del evento es obligatorio', 400);
    }

    const parsedQty = Number(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      throw new CustomError('La cantidad de cupos debe ser un número mayor a 0', 400);
    }

    // 1. Validar que el evento existe
    const event = await this.eventsRepo.getEventById(eventId);
    if (!event) {
      throw new CustomError('Evento deportivo no encontrado', 404);
    }

    // 2. Validar que el evento esté en estado 'published' (no cancelado, no borrador, no finalizado)
    if (event.status !== 'published') {
      throw new CustomError(
        `No se pueden reservar cupos para un evento en estado '${event.status}'. El evento debe estar publicado`,
        400
      );
    }

    // 3. Validar que el usuario no tenga ya un ticket activo para este evento
    const activeTicket = await this.repository.getActiveUserTicket(user.id, eventId);
    if (activeTicket) {
      throw new CustomError(
        'Ya tenés una inscripción activa para este evento deportivo',
        400
      );
    }

    // 4. Validar cupos disponibles (solo cuentan tickets activos; los cancelados no ocupan cupo)
    const occupiedCapacity = await this.repository.getOccupiedCapacity(eventId);
    const availableCapacity = event.capacity - occupiedCapacity;

    if (availableCapacity < parsedQty) {
      throw new CustomError(
        `Cupos insuficientes para este evento. Disponibles: ${Math.max(0, availableCapacity)}, solicitados: ${parsedQty}`,
        400
      );
    }

    // 5. Generar código de reserva y persistir ticket
    const reservationCode = this._generateReservationCode();
    const newTicket = await this.repository.createTicket({
      user: user.id,
      event: eventId,
      quantity: parsedQty,
      reservationCode,
      status: 'confirmed'
    });

    const formattedTicket = {
      id: newTicket._id ? newTicket._id.toString() : newTicket.id,
      user: user.id,
      event: eventId,
      quantity: parsedQty,
      reservationCode,
      status: 'confirmed',
      createdAt: newTicket.createdAt || new Date()
    };

    // 6. Enviar notificación por email mediante Nodemailer
    try {
      await this.mailer.sendTicketConfirmationEmail({
        to: user.email,
        user,
        event,
        ticket: formattedTicket
      });
    } catch (mailError) {
      console.error('[TicketsService] No se pudo enviar el correo de confirmación:', mailError.message);
    }

    return formattedTicket;
  }

  /**
   * Consulta los tickets del usuario autenticado (con populate del evento)
   */
  async getUserTickets(userId) {
    if (!userId) {
      throw new CustomError('ID de usuario requerido', 400);
    }
    return await this.repository.getTicketsByUser(userId);
  }

  /**
   * Consulta los tickets de un evento (solo organizer creador o admin)
   */
  async getEventTickets(eventId, requestingUser) {
    if (!eventId) {
      throw new CustomError('ID del evento requerido', 400);
    }

    const event = await this.eventsRepo.getEventById(eventId);
    if (!event) {
      throw new CustomError('Evento deportivo no encontrado', 404);
    }

    // Control de permisos: solo admin o el organizador dueño del evento
    const organizerId = event.organizer?._id
      ? event.organizer._id.toString()
      : event.organizer?.toString();

    if (requestingUser.role !== 'admin' && organizerId !== requestingUser.id) {
      throw new CustomError('No tenés permisos para consultar los tickets de este evento', 403);
    }

    return await this.repository.getTicketsByEvent(eventId);
  }

  /**
   * Cancela un ticket (soft-cancel), liberando el cupo automáticamente
   */
  async cancelTicket(ticketId, requestingUser) {
    if (!ticketId) {
      throw new CustomError('ID del ticket requerido', 400);
    }

    const ticket = await this.repository.getTicketById(ticketId);
    if (!ticket) {
      throw new CustomError('Ticket de reserva no encontrado', 404);
    }

    // Control de permisos: dueño del ticket o admin
    const ticketUserId = ticket.user?._id
      ? ticket.user._id.toString()
      : ticket.user?.toString();

    if (requestingUser.role !== 'admin' && ticketUserId !== requestingUser.id) {
      throw new CustomError('No tenés permisos para cancelar este ticket', 403);
    }

    // Validar que no esté ya cancelado
    if (ticket.status === 'cancelled') {
      throw new CustomError('El ticket ya se encuentra cancelado', 400);
    }

    const cancelled = await this.repository.cancelTicket(ticketId);
    return cancelled;
  }
}

export default new TicketsService();
