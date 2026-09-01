# 🏆 SportEventHub - Plataforma de Eventos Deportivos (API Backend)

¡Bienvenido a **SportEventHub**! Este proyecto es la API backend para una plataforma de gestión de eventos deportivos, inscripciones y tickets/cupos. Permite organizar torneos, maratones, partidos, competencias y talleres deportivos, conectando a deportistas con organizadores.

Este desarrollo corresponde al proyecto de **Backend II**, implementando una arquitectura profesional por capas con el patrón Repository, Data Access Objects (DAO), Servicios, Controladores, Middlewares, Autenticación centralizada mediante **Passport.js**, **JWT en cookies HttpOnly**, Hashing de contraseñas con `bcrypt` y **Control de Acceso Basado en Roles (RBAC)** con validación de propiedad de recursos.

---

## 📌 Roles del Sistema y Matriz de Permisos

El sistema cuenta con tres roles claramente diferenciados:
- **`user`**: Deportista o asistente común. Puede consultar eventos publicados e inscribirse. No puede crear ni editar eventos.
- **`organizer`**: Club deportivo, entrenador o productora de eventos. Puede crear eventos y modificar/eliminar **únicamente sus propios eventos**.
- **`admin`**: Administrador de la plataforma. Posee control total sobre el sistema, pudiendo crear, modificar cualquier evento y consultar todos los usuarios.

### 📊 Matriz de Permisos

| Acción | Método y Ruta | `user` | `organizer` | `admin` |
| :--- | :--- | :---: | :---: | :---: |
| **Consultar eventos deportivos** | `GET /api/events` | ✅ | ✅ | ✅ |
| **Consultar detalle de un evento** | `GET /api/events/:id` | ✅ | ✅ | ✅ |
| **Ver perfil propio autenticado** | `GET /api/sessions/current` | ✅ | ✅ | ✅ |
| **Crear nuevo evento deportivo** | `POST /api/events` | ❌ (403) | ✅ | ✅ |
| **Modificar eventos propios** | `PUT /api/events/:id` | ❌ (403) | ✅ | ✅ |
| **Modificar cualquier evento ajeno** | `PUT /api/events/:id` | ❌ (403) | ❌ (403) | ✅ |
| **Eliminar eventos propios** | `DELETE /api/events/:id` | ❌ (403) | ✅ | ✅ |
| **Eliminar cualquier evento ajeno** | `DELETE /api/events/:id` | ❌ (403) | ❌ (403) | ✅ |
| **Ver todos los usuarios (Ruta Admin)** | `GET /api/users` | ❌ (403) | ❌ (403) | ✅ |

---

## 🛑 Diferencia entre Errores 401 y 403

En esta entrega se implementa una separación estricta entre errores de autenticación y de autorización:

- **`401 Unauthorized` (Falta de Sesión / No Autenticado)**:
  - Ocurre cuando el cliente intenta acceder a una ruta protegida sin haber iniciado sesión (sin la cookie `currentUser`) o cuando el token JWT ha expirado o es inválido.
  - **Mensaje**: `{"status": "error", "message": "No autenticado"}`
- **`403 Forbidden` (Sesión Válida pero Sin Permisos)**:
  - Ocurre cuando el cliente **está autenticado** correctamente, pero su rol no cuenta con los privilegios suficientes para la acción requerida (por ejemplo, un `user` intentando crear un evento o un `organizer` intentando modificar un evento de otro organizador).
  - **Mensaje**: `{"status": "error", "message": "No tenés permisos para realizar esta acción"}` o `{"status": "error", "message": "No tenés permisos para modificar este evento"}`

---

## 🛠️ Tecnologías Utilizadas

- **Runtime**: [Node.js](https://nodejs.org/) (Módulos ESM - `import/export`)
- **Framework**: [Express.js](https://expressjs.com/)
- **Base de Datos**: [MongoDB](https://www.mongodb.com/) con [Mongoose ODM](https://mongoosejs.com/)
- **Autenticación y Autorización**: [Passport.js](http://www.passportjs.org/) (`passport-local`, `passport-jwt`), [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken), [cookie-parser](https://www.npmjs.com/package/cookie-parser), [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- **Variables de Entorno**: [dotenv](https://www.npmjs.com/package/dotenv)

---

## 📂 Estructura Arquitectónica por Capas

```text
proyecto-eventos-deportivos/
├── src/
│   ├── app.js                 # Configuración de Express, middlewares globales y rutas
│   ├── server.js              # Punto de entrada, conexión a BD e inicio del servidor HTTP
│   ├── config/                # Ajustes centralizados, base de datos y estrategias Passport
│   │   ├── config.js          # Variables de entorno procesadas por dotenv
│   │   ├── db.js              # Conexión Mongoose a la base de datos
│   │   └── passport.config.js # Estrategias 'register', 'login' y 'current'
│   ├── routes/                # Capa de Enrutamiento
│   │   ├── events.router.js   # Rutas de eventos con control de roles y propiedad
│   │   ├── sessions.router.js # Rutas de sesiones (register, login, current, logout)
│   │   └── users.router.js    # Ruta administrativa exclusiva de usuarios
│   ├── controllers/           # Capa de Controladores
│   │   ├── events.controller.js
│   │   ├── sessions.controller.js
│   │   └── users.controller.js
│   ├── services/              # Capa de Lógica de Negocio (Propiedad, Hash, Validaciones)
│   │   ├── events.service.js
│   │   └── sessions.service.js
│   ├── repositories/          # Capa de Abstracción de Persistencia (Patrón Repository)
│   │   ├── events.repository.js
│   │   └── users.repository.js
│   ├── dao/                   # Data Access Objects (Consultas Mongoose directas)
│   │   ├── events.dao.js
│   │   └── users.dao.js
│   ├── models/                # Modelos y Esquemas Mongoose
│   │   ├── User.js            # Modelo base de Usuario (role: user | organizer | admin)
│   │   └── Event.js           # Modelo base de Evento Deportivo (referencia a organizer)
│   ├── middlewares/           # Middlewares de Express
│   │   ├── auth.middleware.js      # Valida sesión activa -> 401 si no hay sesión
│   │   ├── authorize.middleware.js # Valida roles permitidos -> 403 si no coincide
│   │   ├── logger.middleware.js    # Log de peticiones HTTP
│   │   └── error.middleware.js     # Gestor global de errores
│   └── utils/                 # Herramientas y utilidades compartidas
│       ├── jwt.js             # Generación y verificación de tokens JWT
│       ├── hash.js            # Hashing con bcryptjs (createHash, isValidPassword)
│       ├── custom-error.js    # Manejo de excepciones con código HTTP
│       └── response-handler.js# Respuestas JSON estandarizadas
├── .env.example               # Ejemplos de variables de entorno
├── .gitignore                 # Exclusión de archivos sensibles (.env y node_modules)
├── package.json               # Configuración de proyecto en formato ESM y dependencias
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
JWT_EXPIRES_IN=1h
```

---

## 🚀 Cómo Ejecutar la Aplicación

### Modo Desarrollo (con recarga automática):
```bash
npm run dev
```

### Modo Producción:
```bash
npm start
```

El servidor estará escuchando por defecto en: `http://localhost:8080`

---

## 🌐 Catálogo de Rutas y Ejemplos de Respuestas

### 1. Creación de Eventos (`POST /api/events`)
- **Roles permitidos**: `organizer`, `admin`.
- **Headers**: Cookie `currentUser=<jwt_token>`.

#### 🟢 Petición con rol `organizer` o `admin` (`201 Created`):
**Request Body**:
```json
{
  "title": "Torneo Intercolegial de Fútbol 2026",
  "description": "Campeonato juvenil de fútbol 11",
  "sport_category": "Fútbol",
  "date": "2026-10-15",
  "location": "Estadio Central",
  "capacity": 200,
  "price": 1500
}
```
**Response 201**:
```json
{
  "status": "success",
  "payload": {
    "id": "66901f4c7d2e8b1a3c4f5a6b",
    "title": "Torneo Intercolegial de Fútbol 2026",
    "sport_category": "Fútbol",
    "capacity": 200,
    "organizer": "665f2a9b1c2d3e4f5a6b7c8d"
  }
}
```

#### 🔴 Petición con rol `user` (`403 Forbidden`):
**Response 403**:
```json
{
  "status": "error",
  "message": "No tenés permisos para realizar esta acción"
}
```

#### 🔴 Petición sin cookie de sesión (`401 Unauthorized`):
**Response 401**:
```json
{
  "status": "error",
  "message": "No autenticado"
}
```

---

### 2. Modificación de Eventos (`PUT /api/events/:id`)
- **Roles permitidos**: `organizer` (únicamente eventos propios), `admin` (cualquier evento).
- **Headers**: Cookie `currentUser=<jwt_token>`.

#### 🔴 Petición de un `organizer` intentando modificar un evento ajeno (`403 Forbidden`):
**Response 403**:
```json
{
  "status": "error",
  "message": "No tenés permisos para modificar este evento"
}
```

---

### 3. Ruta Administrativa de Usuarios (`GET /api/users`)
- **Roles permitidos**: exclusivamente `admin`.
- **Headers**: Cookie `currentUser=<jwt_token>`.

#### 🟢 Petición con rol `admin` (`200 OK`):
**Response 200**:
```json
{
  "status": "success",
  "message": "Usuarios obtenidos con éxito",
  "payload": [
    {
      "id": "665f2a9b1c2d3e4f5a6b7c8d",
      "first_name": "Admin",
      "last_name": "General",
      "email": "admin@eventos.com",
      "role": "admin",
      "sport_preference": "General"
    }
  ]
}
```

#### 🔴 Petición con rol `organizer` o `user` (`403 Forbidden`):
**Response 403**:
```json
{
  "status": "error",
  "message": "No tenés permisos para realizar esta acción"
}
```

---

### 4. Sesión Actual (`GET /api/sessions/current`)
- **Headers**: Cookie `currentUser=<jwt_token>`.
- **Response 200**: Devuelve `{ id, email, role }`.
- **Response 401**: Si no hay cookie o expiró.
