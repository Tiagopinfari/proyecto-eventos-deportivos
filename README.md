# 🏆 SportEventHub - Plataforma de Eventos Deportivos (API Backend)

¡Bienvenido a **SportEventHub**! Este proyecto es la API backend para una plataforma de gestión de eventos deportivos, inscripciones y tickets/cupos. Permite organizar torneos, maratones, partidos, competencias y talleres deportivos, conectando a deportistas con organizadores.

Este desarrollo corresponde al proyecto de **Backend II**, implementando una arquitectura profesional por capas con el patrón Repository, Data Access Objects (DAO), Servicios, Controladores, Middlewares, Autenticación centralizada mediante **Passport.js**, **JWT en cookies HttpOnly**, Hashing de contraseñas con `bcrypt`, **Control de Acceso Basado en Roles (RBAC)** y el **CRUD completo de Eventos con validaciones de negocio, filtros, ordenamiento y paginación**.

---

## 📌 Roles del Sistema y Matriz de Permisos

El sistema cuenta con tres roles claramente diferenciados:
- **`user`**: Deportista o asistente común. Puede consultar eventos publicados e inscribirse. No puede crear ni editar eventos.
- **`organizer`**: Club deportivo, entrenador o productora de eventos. Puede crear eventos y modificar/cancelar **únicamente sus propios eventos**.
- **`admin`**: Administrador de la plataforma. Posee control total sobre el sistema, pudiendo crear, modificar o cancelar cualquier evento y consultar todos los usuarios.

### 📊 Matriz de Permisos

| Acción | Método y Ruta | Acceso Permitido | Descripción / Restricción |
| :--- | :--- | :---: | :--- |
| **Consultar eventos (listado)** | `GET /api/events` | Público (Todos) | Admite filtros (`status`, `category`, `location`, `dateFrom`, `dateTo`), paginación y ordenamiento. |
| **Consultar detalle de evento** | `GET /api/events/:id` | Público (Todos) | Retorna los detalles del evento o 404 si no existe. |
| **Crear nuevo evento deportivo** | `POST /api/events` | `organizer`, `admin` | `organizer` asignado automáticamente desde `req.user.id`. `user` recibe `403`. |
| **Modificar evento propio** | `PUT /api/events/:id` | Dueño (`organizer`) o `admin` | No permite modificar eventos que ya estén `cancelled`. |
| **Modificar evento ajeno** | `PUT /api/events/:id` | `admin` | Si intenta un `organizer` ajeno, recibe `403 Forbidden`. |
| **Cambiar estado de evento** | `PATCH /api/events/:id/status` | Dueño (`organizer`) o `admin` | Modifica solo el `status`. No permite cambiar estado de eventos cancelados. |
| **Cancelar evento (Soft-delete)** | `DELETE /api/events/:id` | Dueño (`organizer`) o `admin` | Marca el estado como `cancelled`; no se elimina físicamente de la base de datos. |
| **Ver perfil propio autenticado** | `GET /api/sessions/current` | Cualquier usuario autenticado | Retorna `{ id, email, role }`. `401` si no hay sesión. |
| **Ver todos los usuarios** | `GET /api/users` | `admin` | Exclusivo para administradores. `403` para otros roles. |

---

## 🛑 Diferencia entre Errores 401 y 403

En esta API se implementa una separación estricta entre errores de autenticación y de autorización:

- **`401 Unauthorized` (Falta de Sesión / No Autenticado)**:
  - Ocurre cuando el cliente intenta acceder a una ruta protegida sin haber iniciado sesión (sin la cookie `currentUser`) o cuando el token JWT ha expirado o es inválido.
  - **Mensaje**: `{"status": "error", "message": "No autenticado"}`
- **`403 Forbidden` (Sesión Válida pero Sin Permisos)**:
  - Ocurre cuando el cliente **está autenticado** correctamente, pero su rol no cuenta con los privilegios suficientes para la acción requerida (por ejemplo, un rol `user` intentando crear un evento o un `organizer` intentando modificar un evento de otro organizador).
  - **Mensaje**: `{"status": "error", "message": "No tenés permisos para realizar esta acción"}` o `{"status": "error", "message": "No tenés permisos para modificar este evento"}`

---

## 🎯 Reglas de Negocio de la Entidad `Event`

Todas las reglas de negocio viven estrictamente en la capa de **Servicios** (`src/services/events.service.js`), manteniendo controladores y rutas limpios:

1. **Asignación automática del Organizador**: Al crear un evento, el campo `organizer` se asigna automáticamente con el ID del usuario autenticado (`req.user.id`). Si el cliente envía un campo `organizer` en el body, se ignora completamente para evitar suplantaciones.
2. **Referencia por ObjectId**: El organizador se guarda como una referencia `ObjectId` que apunta al modelo `User`, nunca como un objeto embebido.
3. **No permitir fechas pasadas**: Al crear o modificar la fecha de un evento, se rechaza cualquier fecha anterior al momento actual (`date >= now`).
4. **Capacidad y Precios Válidos**: `capacity` debe ser un número entero mayor a 0 (`capacity > 0`); `price` debe ser mayor o igual a 0 (`price >= 0`).
5. **Estados Permitidos (`status`)**: Solo admite valores estrictos: `draft`, `published`, `cancelled`, `finished` (por defecto `'published'`).
6. **Inmutabilidad de Eventos Cancelados**: Un evento con `status: 'cancelled'` no puede ser modificado mediante `PUT` ni cambiar de estado mediante `PATCH`.
7. **Prohibición de Republicar**: No se permite publicar (`status: 'published'`) un evento que ya esté en estado `finished` o `cancelled`.
8. **Cancelación Lógica (Sin Eliminación Física)**: No se eliminan registros físicamente de MongoDB (`findByIdAndDelete`). Las cancelaciones cambian el estado a `'cancelled'` (Soft-Delete).
9. **Control de Propiedad**: Un `organizer` solo puede modificar, cambiar estado o cancelar sus propios eventos. Si intenta hacerlo sobre un evento creado por otro organizador, recibe `403 Forbidden`. El rol `admin` puede modificar cualquier evento.

---

## 🔍 Listado con Filtros, Paginación y Ordenamiento

El endpoint público `GET /api/events` soporta consultas avanzadas mediante query parameters:

| Parámetro | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| **`status`** | String | Filtra por estado exacto (`draft`, `published`, `cancelled`, `finished`). | `?status=published` |
| **`category`** | String | Filtra por categoría deportiva (búsqueda insensible a mayúsculas). | `?category=paddle` |
| **`location`** | String | Filtra por ubicación del evento (insensible a mayúsculas). | `?location=central` |
| **`dateFrom`** | String (ISO) | Eventos cuya fecha sea posterior o igual a `dateFrom`. | `?dateFrom=2026-10-01` |
| **`dateTo`** | String (ISO) | Eventos cuya fecha sea anterior o igual a `dateTo`. | `?dateTo=2026-12-31` |
| **`page`** | Number | Número de página a consultar (por defecto 1). | `?page=2` |
| **`limit`** | Number | Cantidad de eventos por página (por defecto 10). | `?limit=5` |
| **`sort`** | String | Ordenamiento: `date` (ascendente), `-date` (descendente), `price`, `-price`. | `?sort=date` |

### Estructura de Respuesta del Listado:
```json
{
  "status": "success",
  "data": [
    {
      "id": "66901f4c7d2e8b1a3c4f5a6b",
      "title": "Torneo Intercolegial de Fútbol 2026",
      "description": "Campeonato juvenil de fútbol 11",
      "category": "Fútbol",
      "date": "2026-10-15T18:00:00.000Z",
      "location": "Estadio Central",
      "capacity": 200,
      "price": 1500,
      "status": "published",
      "organizer": {
        "id": "665f2a9b1c2d3e4f5a6b7c8d",
        "first_name": "Marcos",
        "last_name": "Gómez",
        "email": "organizador@eventos.com"
      },
      "createdAt": "2026-09-07T15:20:00.000Z",
      "updatedAt": "2026-09-07T15:20:00.000Z"
    }
  ],
  "page": 1,
  "limit": 5,
  "total": 14,
  "totalPages": 3
}
```

---

## 🧪 Guía Práctica de Solicitudes HTTP (Cuerpos y Cookies)

A continuación se presentan ejemplos prácticos y listos para copiar con cabeceras de cookies y cuerpos JSON para probar los endpoints protegidos y públicos mediante herramientas como **Postman**, **Insomnia**, **Thunder Client** o comandos **cURL**:

### 1. Iniciar Sesión y Obtener Cookie (`POST /api/sessions/login`)

Al hacer login, la API responde con la cookie HttpOnly `currentUser`:

```http
POST /api/sessions/login HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "email": "organizador@eventos.com",
  "password": "Password123!"
}
```

**Ejemplo con cURL** (el parámetro `-c cookies.txt` guarda la cookie automáticamente):
```bash
curl -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{"email":"organizador@eventos.com","password":"Password123!"}' \
  -c cookies.txt
```

---

### 2. Crear Evento Deportivo (`POST /api/events`)
- **Acceso requerido**: `organizer` o `admin`.
- **Cabecera obligatoria**: `Cookie: currentUser=<token_jwt>`.

```http
POST /api/events HTTP/1.1
Host: localhost:8080
Content-Type: application/json
Cookie: currentUser=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "title": "Maratón Nocturna Ciudad 10K",
  "description": "Carrera nocturna participativa y competitiva",
  "category": "Running",
  "date": "2026-11-20T20:00:00.000Z",
  "location": "Costanera Sur",
  "capacity": 500,
  "price": 3500,
  "status": "published"
}
```

**Ejemplo con cURL** (usando el archivo de cookies guardado):
```bash
curl -X POST http://localhost:8080/api/events \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Maratón Nocturna Ciudad 10K",
    "description": "Carrera nocturna participativa y competitiva",
    "category": "Running",
    "date": "2026-11-20T20:00:00.000Z",
    "location": "Costanera Sur",
    "capacity": 500,
    "price": 3500
  }'
```

---

### 3. Listar Eventos con Filtros y Paginación (`GET /api/events`)
- **Acceso**: Público (no requiere cookie).

```http
GET /api/events?status=published&category=Running&page=1&limit=5&sort=date HTTP/1.1
Host: localhost:8080
```

**Ejemplo con cURL**:
```bash
curl -X GET "http://localhost:8080/api/events?status=published&category=Running&page=1&limit=5&sort=date"
```

---

### 4. Consultar Detalle de un Evento (`GET /api/events/:id`)
- **Acceso**: Público.

```http
GET /api/events/66901f4c7d2e8b1a3c4f5a6b HTTP/1.1
Host: localhost:8080
```

**Ejemplo con cURL**:
```bash
curl -X GET http://localhost:8080/api/events/66901f4c7d2e8b1a3c4f5a6b
```

---

### 5. Modificar Evento Propio (`PUT /api/events/:id`)
- **Acceso**: Dueño del evento (`organizer`) o `admin`.
- **Cabecera**: `Cookie: currentUser=<token_jwt>`.

```http
PUT /api/events/66901f4c7d2e8b1a3c4f5a6b HTTP/1.1
Host: localhost:8080
Content-Type: application/json
Cookie: currentUser=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "title": "Maratón Nocturna Ciudad 10K - Edición Especial",
  "capacity": 650,
  "price": 4000
}
```

**Ejemplo con cURL**:
```bash
curl -X PUT http://localhost:8080/api/events/66901f4c7d2e8b1a3c4f5a6b \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"capacity": 650, "price": 4000}'
```

---

### 6. Cambiar Estado del Evento (`PATCH /api/events/:id/status`)
- **Acceso**: Dueño del evento (`organizer`) o `admin`.
- **Cabecera**: `Cookie: currentUser=<token_jwt>`.

```http
PATCH /api/events/66901f4c7d2e8b1a3c4f5a6b/status HTTP/1.1
Host: localhost:8080
Content-Type: application/json
Cookie: currentUser=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "status": "cancelled"
}
```

**Ejemplo con cURL**:
```bash
curl -X PATCH http://localhost:8080/api/events/66901f4c7d2e8b1a3c4f5a6b/status \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"status":"cancelled"}'
```

---

### 7. Consultar Sesión Actual (`GET /api/sessions/current`)
- **Acceso**: Cualquier usuario autenticado.
- **Cabecera**: `Cookie: currentUser=<token_jwt>`.

```http
GET /api/sessions/current HTTP/1.1
Host: localhost:8080
Cookie: currentUser=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo con cURL**:
```bash
curl -X GET http://localhost:8080/api/sessions/current -b cookies.txt
```

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
│   ├── controllers/           # Capa de Controladores (Solo req/res)
│   │   ├── events.controller.js
│   │   ├── sessions.controller.js
│   │   └── users.controller.js
│   ├── services/              # Capa de Lógica de Negocio (Propiedad, Validaciones, Hash)
│   │   ├── events.service.js
│   │   └── sessions.service.js
│   ├── repositories/          # Capa de Abstracción de Persistencia (Patrón Repository)
│   │   ├── events.repository.js
│   │   └── users.repository.js
│   ├── dao/                   # Data Access Objects (Consultas directas a Mongoose)
│   │   ├── events.dao.js
│   │   └── users.dao.js
│   ├── models/                # Modelos y Esquemas Mongoose
│   │   ├── User.js            # Modelo base de Usuario (role: user | organizer | admin)
│   │   └── Event.js           # Modelo de Evento Deportivo (referencia ObjectId a organizer)
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
└── README.md                  # Documentación exhaustiva del proyecto
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

## ✅ Casos de Prueba Verificados (Criterios de Aceptación)

| Caso de Prueba | Entrada / Condición | Resultado Esperado | Estado |
| :--- | :--- | :---: | :---: |
| **Crear evento con rol `user`** | `POST /api/events` con sesión de rol `user` | `403 Forbidden` | ✅ Superado |
| **Crear evento con fecha pasada** | `POST /api/events` con `date: "2020-01-01"` | `400 Bad Request` | ✅ Superado |
| **Crear evento con `capacity: 0`** | `POST /api/events` con `capacity: 0` | `400 Bad Request` | ✅ Superado |
| **Crear evento con `price < 0`** | `POST /api/events` con `price: -100` | `400 Bad Request` | ✅ Superado |
| **Asignación automática de organizador** | `POST /api/events` enviando organizer ajeno en body | `201 Created` (`organizer = req.user.id`) | ✅ Superado |
| **Organizer modifica evento propio** | `PUT /api/events/:id` siendo el creador | `200 OK` (actualizado) | ✅ Superado |
| **Organizer modifica evento ajeno** | `PUT /api/events/:id` de otro organizador | `403 Forbidden` | ✅ Superado |
| **Admin modifica evento de otro organizador** | `PUT /api/events/:id` con rol `admin` | `200 OK` (actualizado) | ✅ Superado |
| **Cambiar estado de evento cancelado** | `PATCH /api/events/:id/status` sobre evento `cancelled` | `400 Bad Request` | ✅ Superado |
| **Modificar evento cancelado** | `PUT /api/events/:id` sobre evento `cancelled` | `400 Bad Request` | ✅ Superado |
| **Listar con filtros y paginación** | `GET /api/events?category=Paddle&page=1&limit=5&sort=date` | `200 OK` (`data, page, limit, total, totalPages`) | ✅ Superado |
| **Consultar evento inexistente** | `GET /api/events/:id` con ID inexistente | `404 Not Found` | ✅ Superado |
