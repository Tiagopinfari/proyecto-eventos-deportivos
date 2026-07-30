import express from 'express';
import eventsRouter from './routes/events.router.js';
import sessionsRouter from './routes/sessions.router.js';

const app = express();

// Middlewares globales de formateo de datos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint de verificación de estado del servidor
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    message: 'Servidor activo'
  });
});

// Enrutadores principales
app.use('/api/events', eventsRouter);
app.use('/api/sessions', sessionsRouter);

export default app;
