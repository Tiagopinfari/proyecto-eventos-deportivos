import eventsService from '../services/events.service.js';
import { successResponse } from '../utils/response-handler.js';

export const getEvents = async (req, res, next) => {
  try {
    const events = await eventsService.fetchAllEvents();
    return successResponse(res, events, 'Eventos deportivos obtenidos con éxito');
  } catch (error) {
    next(error);
  }
};
