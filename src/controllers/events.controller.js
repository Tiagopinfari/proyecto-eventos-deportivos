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

export const getEventById = async (req, res, next) => {
  try {
    const event = await eventsService.fetchEventById(req.params.id);
    return successResponse(res, event, 'Evento deportivo obtenido con éxito');
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const newEvent = await eventsService.createNewEvent(req.body, req.user.id);
    return res.status(201).json({
      status: 'success',
      payload: {
        id: newEvent._id ? newEvent._id.toString() : newEvent.id,
        title: newEvent.title,
        sport_category: newEvent.sport_category,
        capacity: newEvent.capacity,
        organizer: newEvent.organizer ? newEvent.organizer.toString() : req.user.id
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const updatedEvent = await eventsService.updateEvent(req.params.id, req.body, req.user);
    return res.status(200).json({
      status: 'success',
      payload: updatedEvent
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    await eventsService.deleteEvent(req.params.id, req.user);
    return res.status(200).json({
      status: 'success',
      message: 'Evento deportivo eliminado con éxito'
    });
  } catch (error) {
    next(error);
  }
};
