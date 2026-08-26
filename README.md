# 🏆 SportEventHub - Plataforma de Eventos Deportivos (API Backend)

¡Bienvenido a **SportEventHub**! Este proyecto es la API backend para una plataforma de gestión de eventos deportivos, inscripciones y tickets/cupos. Permite organizar torneos, maratones, partidos, competencias y talleres deportivos, conectando a deportistas con organizadores.

Este desarrollo corresponde al proyecto de **Backend II**, implementando una arquitectura profesional por capas con el patrón Repository, Data Access Objects (DAO), Servicios, Controladores, Middlewares, Autenticación centralizada mediante **Passport.js** (estrategias `register`, `login` y `current`), **JWT en cookies HttpOnly**, Hashing de contraseñas con `bcrypt` y Configuración centralizada.

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
- **Autenticación Centralizada**: [Passport.js](http://www.passportjs.org/) (`passport-local`, `passport-jwt`)
- **Seguridad**: [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken), [cookie-parser](https://www.npmjs.com/package/cookie-parser), [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- **Variables de Entorno**: [dotenv](https://www.npmjs.com/package/dotenv)
- **Gestor de paquetes**: `npm`

---

## 🛡️ Autenticación y Estrategias de Passport.js

La autenticación está centralizada en `src/config/passport.config.js`:

1. **Estrategia `'register'` (LocalStrategy)**:
   - Valida campos obligatorios, formato de email y longitud de clave.
   - Normaliza el correo (`trim()` + `toLowerCase()`).
   - Verifica unicidad de email (rechaza duplicados).
   - Hashea la contraseña con `bcryptjs`.
   - Asigna de forma segura el rol por defecto `user`.
2. **Estrategia `'login'` (LocalStrategy)**:
   - Valida credenciales contra MongoDB y `bcryptjs`.
   - Ante credenciales inválidas, responde con mensaje genérico `"Credenciales inválidas"` (HTTP 401).
   - Tras el éxito de la estrategia, el **controlador** genera el token JWT y setea la cookie `currentUser`.
3. **Estrategia `'current'` (JWTStrategy)**:
   - Extrae y valida el JWT desde la cookie HttpOnly `currentUser`.
   - Inyecta los datos seguros `{ id, email, role }` en `req.user`.
4. **Preparación para Providers Externos (OAuth)**:
   - La arquitectura modular de `passport.config.js` permite añadir proveedores externos (Google, GitHub, etc.) directamente en dicho archivo sin requerir modificaciones en `app.js` ni en el core de la aplicación.

---

## 📂 Estructura Arquitectónica por Capas

```text
proyecto-eventos-deportivos/
├── src/
│   ├── app.js                 # Configuración de Express, inicialización de Passport y rutas
│   ├── server.js              # Punto de entrada, conexión a BD e inicio del servidor HTTP
│   ├── config/                # Ajustes centralizados, base de datos y estrategias Passport
│   │   ├── config.js          # Variables de entorno procesadas por dotenv
│   │   ├── db.js              # Conexión Mongoose a la base de datos
│   │   └── passport.config.js # Estrategias 'register', 'login' y 'current' centralizadas
│   ├── routes/                # Capa de Enrutamiento (Events, Sessions)
│   │   ├── events.router.js
│   │   └── sessions.router.js # Rutas de sesiones delegadas en Passport
│   ├── controllers/           # Capa de Controladores (Generación de JWT / Cookies)
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
│   │   ├── User.js            # Modelo base de Usuario (first_name, last_name, email, password, role)
│   │   └── Event.js           # Modelo base de Evento Deportivo
│   ├── middlewares/           # Middlewares de Express
│   │   ├── auth.middleware.js # Wrapper passportCall para manejo estándar de estrategias
│   │   ├── logger.middleware.js # Log de peticiones HTTP
│   │   └── error.middleware.js  # Gestor global de errores
│   └── utils/                 # Herramientas y utilidades compartidas
│       ├── jwt.js             # Helper para firmar y verificar tokens JWT
│       ├── hash.js            # Helper de hashing con bcryptjs (createHash, isValidPassword)
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

## 🌐 Tabla de Rutas y Endpoints Disponibles

| Método | Ruta | Descripción | Estrategia Passport | Cookie |
| :--- | :--- | :--- | :---: | :---: |
| `GET` | `/api/health` | Estado de salud del servidor | - | - |
| `GET` | `/api/events` | Listado de eventos deportivos | - | - |
| `POST` | `/api/sessions/register` | Registro seguro de usuarios | `passport.authenticate('register')` | - |
| `POST` | `/api/sessions/login` | Inicio de sesión y JWT en Cookie | `passport.authenticate('login')` | Setea `currentUser` |
| `GET` | `/api/sessions/current` | Obtiene el usuario autenticado | `passport.authenticate('current')` | Requiere `currentUser` |
| `POST` | `/api/sessions/logout` | Cierre de sesión | - | Borra `currentUser` |

---

## 📖 Detalles y Ejemplos de Peticiones

### 1. Registro de Usuarios (`POST /api/sessions/register`)
- **Request Body**:
```json
{
  "first_name": "Ana",
  "last_name": "Pérez",
  "email": "ana@mail.com",
  "password": "Secreta123"
}
```
- **Response 201 Created**:
```json
{
  "status": "success",
  "payload": {
    "id": "665f2a9b1c2d3e4f5a6b7c8d",
    "first_name": "Ana",
    "last_name": "Pérez",
    "email": "ana@mail.com",
    "role": "user"
  }
}
```

---

### 2. Inicio de Sesión (`POST /api/sessions/login`)
- **Request Body**:
```json
{
  "email": "ana@mail.com",
  "password": "Secreta123"
}
```
- **Response 200 OK** (Setea Cookie HttpOnly `currentUser`):
```json
{
  "status": "success",
  "message": "Login correcto"
}
```
- **Response 401 Unauthorized** (Credenciales inválidas):
```json
{
  "status": "error",
  "message": "Credenciales inválidas"
}
```

---

### 3. Usuario Actual Protegido (`GET /api/sessions/current`)
- **Request Header**: Cookie `currentUser=<jwt_token>`
- **Response 200 OK**:
```json
{
  "status": "success",
  "payload": {
    "id": "665f2a9b1c2d3e4f5a6b7c8d",
    "email": "ana@mail.com",
    "role": "user"
  }
}
```
- **Response 401 Unauthorized** (Sin cookie o token expirado/alterado):
```json
{
  "status": "error",
  "message": "No autenticado"
}
```

---

### 4. Cierre de Sesión (`POST /api/sessions/logout`)
- **Response 200 OK**:
```json
{
  "status": "success",
  "message": "Sesión cerrada"
}
```
