import { Router } from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/events.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const router = Router();

// Consultar eventos deportivos (Público: user, organizer, admin)
router.get('/', getEvents);
router.get('/:id', getEventById);

// Crear eventos deportivos (Solo organizer y admin -> 403 para user, 401 si no hay sesión)
router.post('/', authMiddleware, authorize(['organizer', 'admin']), createEvent);

// Modificar eventos deportivos (organizer solo eventos propios, admin cualquiera)
router.put('/:id', authMiddleware, authorize(['organizer', 'admin']), updateEvent);

// Eliminar eventos deportivos (organizer solo eventos propios, admin cualquiera)
router.delete('/:id', authMiddleware, authorize(['organizer', 'admin']), deleteEvent);

export default router;
