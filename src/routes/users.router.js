import { Router } from 'express';
import { getAllUsers } from '../controllers/users.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { authorize } from '../middlewares/authorize.middleware.js';

const router = Router();

// GET /api/users - Ruta administrativa (solo accesible por usuarios con rol 'admin')
router.get('/', authMiddleware, authorize(['admin']), getAllUsers);

export default router;
