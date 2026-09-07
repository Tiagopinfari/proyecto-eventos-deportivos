import { Router } from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  updateEventStatus,
  deleteEvent
} from '../controllers/events.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const router = Router();

// Consultar eventos deportivos (Público: sin autenticación o con cualquier rol)
router.get('/', getEvents);
router.get('/:id', getEventById);

// Crear eventos deportivos (Solo organizer y admin -> 403 para user, 401 si no hay sesión)
router.post('/', authMiddleware, authorize(['organizer', 'admin']), createEvent);

// Modificar eventos deportivos (organizer solo eventos propios, admin cualquiera)
router.put('/:id', authMiddleware, authorize(['organizer', 'admin']), updateEvent);

// Cambiar estado del evento (organizer solo eventos propios, admin cualquiera)
router.patch('/:id/status', authMiddleware, authorize(['organizer', 'admin']), updateEventStatus);

// Cancelar evento (soft-delete, organizer solo eventos propios, admin cualquiera)
router.delete('/:id', authMiddleware, authorize(['organizer', 'admin']), deleteEvent);

export default router;
