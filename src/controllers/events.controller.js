import eventsService from '../services/events.service.js';

/**
 * Listado de eventos con filtros, paginación y ordenamiento (Público)
 * Respuesta incluye: data, page, limit, total, totalPages
 */
export const getEvents = async (req, res, next) => {
  try {
    const result = await eventsService.fetchAllEvents(req.query);
    return res.status(200).json({
      status: 'success',
      data: result.data,
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Consulta de evento por ID (Público)
 */
export const getEventById = async (req, res, next) => {
  try {
    const event = await eventsService.fetchEventById(req.params.id);
    return res.status(200).json({
      status: 'success',
      payload: event
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Creación de evento (organizer, admin)
 * El organizer se asigna automáticamente desde req.user.id
 */
export const createEvent = async (req, res, next) => {
  try {
    const newEvent = await eventsService.createNewEvent(req.body, req.user.id);
    return res.status(201).json({
      status: 'success',
      message: 'Evento deportivo creado con éxito',
      payload: newEvent
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Modificación completa de evento (dueño o admin)
 */
export const updateEvent = async (req, res, next) => {
  try {
    const updatedEvent = await eventsService.updateEvent(req.params.id, req.body, req.user);
    return res.status(200).json({
      status: 'success',
      message: 'Evento deportivo actualizado con éxito',
      payload: updatedEvent
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Modificación de estado de evento (PATCH /api/events/:id/status)
 */
export const updateEventStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const updatedEvent = await eventsService.changeEventStatus(req.params.id, status, req.user);
    return res.status(200).json({
      status: 'success',
      message: `Estado del evento actualizado a '${status}'`,
      payload: updatedEvent
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancelación lógica de evento (soft delete)
 */
export const deleteEvent = async (req, res, next) => {
  try {
    const cancelledEvent = await eventsService.deleteEvent(req.params.id, req.user);
    return res.status(200).json({
      status: 'success',
      message: 'Evento deportivo cancelado con éxito',
      payload: cancelledEvent
    });
  } catch (error) {
    next(error);
  }
};
