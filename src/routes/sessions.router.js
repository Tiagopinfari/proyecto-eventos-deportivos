import { Router } from 'express';
import { getSessionStatus, login, register, getCurrentUser, logout } from '../controllers/sessions.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/sessions - Estado del módulo de sesiones
router.get('/', getSessionStatus);

// POST /api/sessions/register - Registro de usuarios
router.post('/register', register);

// POST /api/sessions/login - Inicio de sesión (devuelve cookie HttpOnly currentUser)
router.post('/login', login);

// GET /api/sessions/current - Obtiene el usuario autenticado en la sesión actual
router.get('/current', authMiddleware, getCurrentUser);

// POST /api/sessions/logout - Cierra la sesión y elimina la cookie currentUser
router.post('/logout', logout);

export default router;
