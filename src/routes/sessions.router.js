import { Router } from 'express';
import { getSessionStatus, login, register, getCurrentUser, logout } from '../controllers/sessions.controller.js';
import { passportCall } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/sessions - Estado del módulo de sesiones
router.get('/', getSessionStatus);

// POST /api/sessions/register - Delegado a la estrategia 'register' de Passport
router.post('/register', passportCall('register'), register);

// POST /api/sessions/login - Delegado a la estrategia 'login' de Passport
router.post('/login', passportCall('login'), login);

// GET /api/sessions/current - Delegado a la estrategia 'current' de Passport (JWT)
router.get('/current', passportCall('current'), getCurrentUser);

// POST /api/sessions/logout - Cierra la sesión y elimina la cookie currentUser
router.post('/logout', logout);

export default router;
