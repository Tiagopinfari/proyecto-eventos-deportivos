import app from './app.js';
import config from './config/config.js';
import connectDB from './config/db.js';

// Conexión a MongoDB
connectDB();

app.listen(config.port, () => {
  console.log(`[Servidor Deportivo] Servidor escuchando en http://localhost:${config.port}`);
  console.log(`[Servidor Deportivo] Entorno: ${config.nodeEnv}`);
});
