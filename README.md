# 🏆 SportEventHub - Plataforma de Eventos Deportivos (API Backend)

¡Bienvenido a **SportEventHub**! Este proyecto es la API backend para una plataforma de gestión de eventos deportivos, inscripciones y tickets/cupos. Permite organizar torneos, maratones, partidos, competencias y talleres deportivos, conectando a deportistas con organizadores.

Este desarrollo corresponde al proyecto de **Backend II**, implementando una arquitectura profesional por capas con el patrón Repository, Data Access Objects (DAO), Servicios, Controladores, Middlewares y Configuración centralizada.

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

## 📂 Estructura Arquitectónica por Capas

El proyecto está organizado siguiendo una arquitectura desacoplada en 3 capas principales y módulos auxiliares:

```text
proyecto-eventos-deportivos/
├── src/
│   ├── app.js                 # Configuración de Express, middlewares globales y rutas
│   ├── server.js              # Punto de entrada, conexión a BD e inicio del servidor HTTP
│   ├── config/                # Ajustes centralizados y conexión a MongoDB
│   │   ├── config.js          # Variables de entorno procesadas por dotenv
│   │   └── db.js              # Conexión Mongoose a la base de datos
│   ├── routes/                # Capa de Enrutamiento (Events, Sessions)
│   │   ├── events.router.js
│   │   └── sessions.router.js
│   ├── controllers/           # Capa de Controladores (Request / Response)
│   │   ├── events.controller.js
│   │   └── sessions.controller.js
│   ├── services/              # Capa de Lógica de Negocio
│   │   ├── events.service.js
│   │   └── sessions.service.js
│   ├── repositories/          # Capa de Abstracción de Persistencia (Patrón Repository)
│   │   ├── events.repository.js
│   │   └── users.repository.js
│   ├── dao/                   # Data Access Objects (Consultas Mongoose directas)
│   │   ├── events.dao.js
│   │   └── users.dao.js
│   ├── models/                # Modelos y Esquemas Mongoose
│   │   ├── User.js            # Modelo base de Usuario (Deportista / Organizador / Admin)
│   │   └── Event.js           # Modelo base de Evento Deportivo
│   ├── middlewares/           # Middlewares de Express
│   │   ├── logger.middleware.js # Log de peticiones HTTP
│   │   └── error.middleware.js  # Gestor global de errores
│   └── utils/                 # Herramientas y utilidades compartidas
│       ├── custom-error.js    # Manejo de excepciones con código HTTP
│       └── response-handler.js# Respuestas JSON estandarizadas
├── .env.example               # Ejemplos de variables de entorno
├── .gitignore                 # Exclusión de archivos sensibles e instalados
├── package.json               # Configuración de proyecto en formato ESM
└── README.md                  # Documentación del proyecto
```

---

## ⚙️ Instalación y Configuración

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/Tiagopinfari/proyecto-eventos-deportivos.git
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

## 🌐 Endpoints Disponibles

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
  "message": "Eventos deportivos obtenidos con éxito",
  "payload": []
}
```

### 3. Módulo de Sesiones
- **Ruta**: `GET /api/sessions`
- **Respuesta esperada** (`200 OK`):
```json
{
  "status": "success",
  "message": "Estructura inicial de sesiones lista",
  "payload": {
    "status": "active",
    "module": "sessions",
    "timestamp": "2026-08-06T14:44:00.000Z"
  }
}
```
