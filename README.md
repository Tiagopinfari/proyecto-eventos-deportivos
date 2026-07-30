# 🏆 SportEventHub - Plataforma de Eventos Deportivos (API Backend)

¡Bienvenido a **SportEventHub**! Este proyecto es la API backend para una plataforma de gestión de eventos deportivos, inscripciones y tickets/cupos. Permite organizar torneos, maratones, partidos, competencias y talleres deportivos, conectando a deportistas con organizadores.

Este desarrollo corresponde a la **Pre-entrega 1 del curso Backend II**, donde se establece el refactor e infraestructura base de arquitectura en capas con Express y Node.js.

---

## 📌 Temática Elegida

**Eventos Deportivos**:
- **Roles soportados**:
  - `Admin`: Gestión global de usuarios, categorías y eventos.
  - `Organizer`: Clubes, entrenadores y productoras deportivas que crean y gestionan torneos o carreras.
  - `User`: Deportistas y aficionados que navegan eventos e inscriben o compran cupos/entradas.

---

## 🛠️ Tecnologías Utilizadas

- **Runtime**: [Node.js](https://nodejs.org/) (Módulos ESM - `import/export`)
- **Framework**: [Express.js](https://expressjs.com/)
- **Base de Datos**: [MongoDB](https://www.mongodb.com/) con [Mongoose ODM](https://mongoosejs.com/)
- **Variables de Entorno**: [dotenv](https://www.npmjs.com/package/dotenv)
- **Gestor de paquetes**: `npm`

---

## 📂 Estructura de Carpetas

El proyecto está organizado siguiendo una arquitectura profesional por capas:

```text
proyecto-eventos-deportivos/
├── src/
│   ├── app.js                 # Configuración de Express, middlewares y rutas (sin listen)
│   ├── server.js              # Punto de entrada que inicializa y escucha el servidor HTTP
│   ├── config/                # Ajustes y configuración de base de datos / constantes
│   ├── routes/                # Capa de Enrutamiento (Events, Sessions)
│   │   ├── events.router.js
│   │   └── sessions.router.js
│   ├── controllers/           # Capa de Controladores (Procesamiento de Request y Response)
│   │   ├── events.controller.js
│   │   └── sessions.controller.js
│   ├── services/              # Capa de Servicios (Lógica de Negocio)
│   ├── repositories/          # Capa de Repositorios (Patrón Repository)
│   ├── dao/                   # Data Access Object (Persistencia y consultas Mongo)
│   ├── models/                # Modelos y Esquemas Mongoose
│   │   ├── User.js            # Modelo base de Usuario (Deportista / Organizador / Admin)
│   │   └── Event.js           # Modelo base de Evento Deportivo
│   ├── middlewares/           # Middlewares de validación, autorización y errores
│   └── utils/                 # Funciones auxiliares y herramientas compartidas
├── .env.example               # Ejemplos de variables de entorno
├── .gitignore                 # Exclusión de archivos sensibles e instalados
├── package.json               # Configuración de proyecto en formato ESM
└── README.md                  # Documentación del proyecto
```

---

## ⚙️ Instalación y Configuración

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone <URL_DE_TU_REPOSITORIO_GITHUB>
cd proyecto-eventos-deportivos
npm install
```

### 2. Configuración de Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
PORT=8080
NODE_ENV=development
MONGO_URL=mongodb+srv://<usuario>:<password>@cluster0.example.mongodb.net/eventos_deportivos?retryWrites=true&w=majority
JWT_SECRET=tu_secreto_super_seguro_jwt_backend2
```

---

## 🚀 Cómo Ejecutar la Aplicación

### Modo Desarrollo (con recarga automática Node `--watch`):
```bash
npm run dev
```

### Modo Producción:
```bash
npm start
```

El servidor estará escuchando por defecto en: `http://localhost:8080`

---

## 🌐 Endpoints Disponibles en esta Pre-Entrega

### 1. Estado de Salud del Servidor
- **Ruta**: `GET /api/health`
- **Respuesta esperada** (`200 OK`):
```json
{
  "status": "ok",
  "message": "Servidor activo"
}
```

### 2. Listado de Eventos Deportivos
- **Ruta**: `GET /api/events`
- **Respuesta esperada** (`200 OK`):
```json
{
  "status": "success",
  "payload": []
}
```

### 3. Módulo de Sesiones (Estructura Inicial)
- **Ruta**: `GET /api/sessions`
- **Respuesta esperada** (`200 OK`):
```json
{
  "status": "success",
  "message": "Estructura inicial de sesiones lista"
}
```
