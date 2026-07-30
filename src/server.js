import dotenv from 'dotenv';
import app from './app.js';

// Carga de variables de entorno desde el archivo .env
dotenv.config();

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`[Servidor Deportivo] Servidor escuchando en http://localhost:${PORT}`);
  console.log(`[Servidor Deportivo] Entorno: ${process.env.NODE_ENV || 'development'}`);
});
