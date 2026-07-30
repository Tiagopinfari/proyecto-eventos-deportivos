import { Router } from 'express';
import { getSessionStatus, login, register } from '../controllers/sessions.controller.js';

const router = Router();

// GET /api/sessions - Estado del módulo de sesiones
router.get('/', getSessionStatus);

// Rutas declaradas para futuras implementaciones de Auth
router.post('/register', register);
router.post('/login', login);

export default router;
