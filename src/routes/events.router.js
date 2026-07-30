import { Router } from 'express';
import { getEvents } from '../controllers/events.controller.js';

const router = Router();

// GET /api/events - Lista todos los eventos deportivos
router.get('/', getEvents);

export default router;
