import { Router } from 'express';
import { getMyTickets, cancelTicket } from '../controllers/tickets.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

// Consultar tickets del usuario autenticado
router.get('/my-tickets', authMiddleware, getMyTickets);

// Cancelar ticket propio o por admin
router.patch('/:tid/cancel', authMiddleware, cancelTicket);

export default router;
