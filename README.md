# 🏆 SportEventHub - Plataforma de Eventos Deportivos (API Backend)

¡Bienvenido a **SportEventHub**! Este proyecto es la API backend para una plataforma de gestión de eventos deportivos, inscripciones y tickets/cupos. Permite organizar torneos, maratones, partidos, competencias y talleres deportivos, conectando a deportistas con organizadores.

Este desarrollo corresponde al proyecto de **Backend II**, implementando una arquitectura profesional por capas con el patrón Repository, Data Access Objects (DAO), Servicios, Controladores, Middlewares, Hashing seguro con `bcrypt` y Configuración centralizada.

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
- **Seguridad**: [bcryptjs](https://www.npmjs.com/package/bcryptjs) para hashing de contraseñas
- **Variables de Entorno**: [dotenv](https://www.npmjs.com/package/dotenv)
- **Gestor de paquetes**: `npm`

---

## 📂 Estructura Arquitectónica por Capas

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
│   │   └── sessions.router.js # Endpoint POST /api/sessions/register
│   ├── controllers/           # Capa de Controladores (Request / Response)
│   │   ├── events.controller.js
│   │   └── sessions.controller.js
│   ├── services/              # Capa de Lógica de Negocio (Validación, Hash, Normalización)
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
│   │   ├── logger.middleware.js # Log de peticiones HTTP
│   │   └── error.middleware.js  # Gestor global de errores
│   └── utils/                 # Herramientas y utilidades compartidas
│       ├── hash.js            # Helper reutilizable de bcryptjs (createHash, isValidPassword)
│       ├── custom-error.js    # Manejo de excepciones con código HTTP
│       └── response-handler.js# Respuestas JSON estandarizadas
├── .env.example               # Ejemplos de variables de entorno
├── .gitignore                 # Exclusión de archivos sensibles e instalados (.env y node_modules)
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

## 🌐 Endpoints Disponibles y Guía de Pruebas

### 1. Registro Seguro de Usuarios (`POST /api/sessions/register`)

Permite registrar nuevos usuarios en el sistema. Aplica validaciones de campos obligatorios, formato de email, normalización (`trim()` + `toLowerCase()`), hash de contraseña con `bcrypt` y forzado del rol por defecto `user`.

#### **Campos que espera el body (JSON):**
| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `first_name` | String | Sí | Nombre del usuario |
| `last_name` | String | Sí | Apellido del usuario |
| `email` | String | Sí | Correo electrónico (se normaliza a minúsculas sin espacios) |
| `password` | String | Sí | Contraseña en texto plano (mínimo 6 caracteres) |

#### **Casos de prueba:**

##### 🟢 Caso 1: Registro Exitoso (`201 Created`)
**Request Body**:
```json
{
  "first_name": "Ana",
  "last_name": "Pérez",
  "email": "Ana@Mail.com ",
  "password": "Secreta123"
}
```
**Response 201 Created** (Respuesta sanitizada sin la contraseña):
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

##### 🔴 Caso 2: Campos Faltantes (`400 Bad Request`)
**Request Body**:
```json
{
  "first_name": "Ana",
  "email": "ana@mail.com"
}
```
**Response 400 Bad Request**:
```json
{
  "status": "error",
  "message": "Faltan campos obligatorios"
}
```

##### 🔴 Caso 3: Formato de Email Inválido (`400 Bad Request`)
**Request Body**:
```json
{
  "first_name": "Ana",
  "last_name": "Pérez",
  "email": "formato_invalido",
  "password": "Secreta123"
}
```
**Response 400 Bad Request**:
```json
{
  "status": "error",
  "message": "Formato de email inválido"
}
```

##### 🔴 Caso 4: Email ya Registrado (`409 Conflict`)
**Response 409 Conflict**:
```json
{
  "status": "error",
  "message": "El email ya está registrado"
}
```

---

### 2. Estado de Salud del Servidor (`GET /api/health`)
- **Respuesta esperada** (`200 OK`):
```json
{
  "status": "ok",
  "message": "Servidor activo"
}
```

### 3. Listado de Eventos Deportivos (`GET /api/events`)
- **Respuesta esperada** (`200 OK`):
```json
{
  "status": "success",
  "message": "Eventos deportivos obtenidos con éxito",
  "payload": []
}
```
