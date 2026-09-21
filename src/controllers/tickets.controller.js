import ticketsService from '../services/tickets.service.js';
import TicketDTO from '../dto/ticket.dto.js';

/**
 * Crea un ticket / inscripción para un evento (Autenticado)
 */
export const createTicket = async (req, res, next) => {
  try {
    const { eid } = req.params;
    const { quantity } = req.body;
    const newTicket = await ticketsService.createTicket({
      eventId: eid,
      user: req.user,
      quantity: quantity || 1
    });

    return res.status(201).json({
      status: 'success',
      message: 'Inscripción realizada con éxito',
      payload: TicketDTO.from(newTicket)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Consulta los tickets del usuario autenticado (Autenticado)
 */
export const getMyTickets = async (req, res, next) => {
  try {
    const tickets = await ticketsService.getUserTickets(req.user.id);
    return res.status(200).json({
      status: 'success',
      message: 'Tickets obtenidos con éxito',
      payload: TicketDTO.from(tickets)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Consulta los tickets de un evento (Organizer del evento o Admin)
 */
export const getEventTickets = async (req, res, next) => {
  try {
    const { eid } = req.params;
    const tickets = await ticketsService.getEventTickets(eid, req.user);
    return res.status(200).json({
      status: 'success',
      message: 'Tickets del evento obtenidos con éxito',
      payload: TicketDTO.from(tickets)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancela una reserva de ticket (Dueño del ticket o Admin)
 */
export const cancelTicket = async (req, res, next) => {
  try {
    const { tid } = req.params;
    const cancelledTicket = await ticketsService.cancelTicket(tid, req.user);
    return res.status(200).json({
      status: 'success',
      message: 'Ticket cancelado con éxito',
      payload: TicketDTO.from(cancelledTicket)
    });
  } catch (error) {
    next(error);
  }
};
