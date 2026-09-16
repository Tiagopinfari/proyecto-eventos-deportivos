# 🏆 SportEventHub - Plataforma de Eventos Deportivos (API Backend)

¡Bienvenido a **SportEventHub**! Este proyecto es la API backend para una plataforma de gestión de eventos deportivos, inscripciones y tickets/cupos. Permite organizar torneos, maratones, partidos, competencias y talleres deportivos, conectando a deportistas con organizadores.

Este desarrollo corresponde al proyecto de **Backend II**, implementando una arquitectura profesional por capas con el patrón Repository, Data Access Objects (DAO), Servicios, Controladores, Middlewares, Autenticación centralizada mediante **Passport.js**, **JWT en cookies HttpOnly**, Hashing de contraseñas con `bcrypt`, **Control de Acceso Basado en Roles (RBAC)**, CRUD de Eventos y el **Flujo completo de Inscripciones, Tickets, Control de Cupos en tiempo real y Notificaciones por Email con Nodemailer**.

---

## 📌 Roles del Sistema y Matriz de Permisos

El sistema cuenta con tres roles claramente diferenciados:
- **`user`**: Deportista o asistente común. Puede consultar eventos publicados, inscribirse a eventos, consultar sus propios tickets y cancelarlos.
- **`organizer`**: Club deportivo, entrenador o productora de eventos. Puede crear eventos, modificar/cancelar únicamente sus propios eventos y **consultar los tickets emitidos para sus eventos**.
- **`admin`**: Administrador de la plataforma. Posee control total sobre el sistema, pudiendo gestionar cualquier evento, cancelar cualquier ticket y consultar todos los usuarios y tickets.

### 📊 Matriz de Permisos

| Acción | Método y Ruta | Acceso Permitido | Descripción / Restricción |
| :--- | :--- | :---: | :--- |
| **Consultar eventos (listado)** | `GET /api/events` | Público (Todos) | Admite filtros (`status`, `category`, `location`, `dateFrom`, `dateTo`), paginación y ordenamiento. |
| **Consultar detalle de evento** | `GET /api/events/:id` | Público (Todos) | Retorna los detalles del evento o 404 si no existe. |
| **Crear nuevo evento deportivo** | `POST /api/events` | `organizer`, `admin` | `organizer` asignado automáticamente desde `req.user.id`. `user` recibe `403`. |
| **Modificar evento propio** | `PUT /api/events/:id` | Dueño (`organizer`) o `admin` | No permite modificar eventos que ya estén `cancelled`. |
| **Modificar evento ajeno** | `PUT /api/events/:id` | `admin` | Si intenta un `organizer` ajeno, recibe `403 Forbidden`. |
| **Cambiar estado de evento** | `PATCH /api/events/:id/status` | Dueño (`organizer`) o `admin` | Modifica solo el `status`. No permite reactivar eventos cancelados. |
| **Cancelar evento (Soft-delete)** | `DELETE /api/events/:id` | Dueño (`organizer`) o `admin` | Marca el estado como `cancelled`; no se elimina físicamente de la base de datos. |
| **Inscribirse a un evento (Ticket)** | `POST /api/events/:eid/tickets` | Cualquier usuario autenticado | Valida evento publicado, no duplicados y cupos disponibles. Envía email de confirmación. |
| **Consultar mis tickets** | `GET /api/tickets/my-tickets` | Cualquier usuario autenticado | Retorna exclusivamente los tickets propios con datos del evento vía `populate`. |
| **Consultar tickets de un evento** | `GET /api/events/:eid/tickets` | Dueño (`organizer`) o `admin` | Lista inscriptos al evento. `403` para usuarios comunes u organizadores ajenos. |
| **Cancelar ticket (Reserva)** | `PATCH /api/tickets/:tid/cancel` | Dueño del ticket o `admin` | Marca `cancelled`, registra `cancelledAt` y libera el cupo automáticamente. |
| **Ver perfil propio autenticado** | `GET /api/sessions/current` | Cualquier usuario autenticado | Retorna `{ id, email, role }`. `401` si no hay sesión. |
| **Ver todos los usuarios** | `GET /api/users` | `admin` | Exclusivo para administradores. `403` para otros roles. |

---

## 🛑 Diferencia entre Errores 401 y 403

En esta API se implementa una separación estricta entre errores de autenticación y de autorización:

- **`401 Unauthorized` (Falta de Sesión / No Autenticado)**:
  - Ocurre cuando el cliente intenta acceder a una ruta protegida sin haber iniciado sesión (sin la cookie `currentUser`) o cuando el token JWT ha expirado o es inválido.
  - **Mensaje**: `{"status": "error", "message": "No autenticado"}`
- **`403 Forbidden` (Sesión Válida pero Sin Permisos)**:
  - Ocurre cuando el cliente **está autenticado** correctamente, pero su rol no cuenta con los privilegios suficientes para la acción requerida (por ejemplo, un rol `user` intentando crear un evento o ver tickets de un evento ajeno, o un `organizer` intentando modificar eventos o tickets de otro organizador).
  - **Mensaje**: `{"status": "error", "message": "No tenés permisos para realizar esta acción"}` o `{"status": "error", "message": "No tenés permisos para consultar los tickets de este evento"}`

---

## 🎟️ Entidad `Ticket`, Control de Cupos y Reglas de Negocio

Todas las validaciones y reglas de negocio residen en la capa de servicios (`src/services/tickets.service.js`), garantizando controladores limpios y separación de responsabilidades:

1. **Modelo `Ticket` con Referencias**:
   - `user`: Referencia `ObjectId` a la colección `users` (sin objetos embebidos).
   - `event`: Referencia `ObjectId` a la colección `events` (sin objetos embebidos).
   - `status`: Enum estricto `['confirmed', 'pending', 'cancelled']` (por defecto `'confirmed'`).
   - `quantity`: Cantidad de cupos solicitados (número entero positivo `> 0`).
   - `reservationCode`: Código único de reserva alfanumérico generado en el backend (ej: `TK-A1B2-C3D4`).
   - `cancelledAt`: Fecha y hora de cancelación (o `null` si está activo).
   - `createdAt` y `updatedAt`: Marcas de tiempo gestionadas por Mongoose.

2. **Validaciones al Inscribirse**:
   - **Existencia del evento**: Si no existe el evento en la BD, retorna `404 Not Found`.
   - **Estado publicado**: El evento debe tener `status === 'published'`. No se permite reservar en eventos en estado `draft`, `cancelled` o `finished` (retorna `400 Bad Request`).
   - **Cantidad válida**: `quantity` debe ser un número entero mayor a 0 (`quantity > 0`).
   - **Prevención de inscripciones duplicadas**: Un usuario no puede tener más de un ticket activo (`confirmed` o `pending`) para un mismo evento. Si ya tiene uno, retorna `400 Bad Request`.
   - **Control estricto de cupos en tiempo real**:
     $$\text{Cupos Ocupados} = \sum_{\text{tickets activos}} \text{quantity}$$
     Solo cuentan los tickets con `status !== 'cancelled'`. Los tickets cancelados **no ocupan cupo**.
     $$\text{Cupos Disponibles} = \text{capacidad total del evento} - \text{cupos ocupados}$$
     Si $\text{disponibles} < \text{quantity}$, la inscripción se rechaza con un mensaje descriptivo (`400 Bad Request`).

3. **Cancelación de Tickets**:
   - No se realiza eliminación física en la base de datos (`findByIdAndDelete`).
   - Se actualiza `status = 'cancelled'` y se guarda la fecha en `cancelledAt`.
   - Solo el titular de la reserva (`ticket.user`) o un usuario con rol `admin` pueden cancelar el ticket (`403 Forbidden` si intenta otro usuario).
   - Si el ticket ya fue cancelado previamente, se rechaza la solicitud (`400 Bad Request`).
   - Al cancelarse, los cupos quedan liberados automáticamente para nuevas inscripciones.

4. **Notificaciones por Email con Nodemailer**:
   - Al confirmar la reserva, se envía un correo electrónico al usuario con el resumen del evento y el código de reserva.
   - Las credenciales y parámetros de conexión se leen desde variables de entorno (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`).
   - El servicio es tolerante a fallos: un problema de conexión con el servidor SMTP no interrumpe ni revierte la emisión exitosa del ticket.

---

## 🔍 Listado con Filtros, Paginación y Ordenamiento

El endpoint público `GET /api/events` soporta consultas avanzadas mediante query parameters:

| Parámetro | Tipo | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| **`status`** | String | Filtra por estado exacto (`draft`, `published`, `cancelled`, `finished`). | `?status=published` |
| **`category`** | String | Filtra por categoría deportiva (búsqueda insensible a mayúsculas). | `?category=running` |
| **`location`** | String | Filtra por ubicación del evento (insensible a mayúsculas). | `?location=costanera` |
| **`dateFrom`** | String (ISO) | Eventos cuya fecha sea posterior o igual a `dateFrom`. | `?dateFrom=2026-10-01` |
| **`dateTo`** | String (ISO) | Eventos cuya fecha sea anterior o igual a `dateTo`. | `?dateTo=2026-12-31` |
| **`page`** | Number | Número de página a consultar (por defecto 1). | `?page=2` |
| **`limit`** | Number | Cantidad de eventos por página (por defecto 10). | `?limit=5` |
| **`sort`** | String | Ordenamiento: `date` (ascendente), `-date` (descendente), `price`, `-price`. | `?sort=date` |

---

## 🧪 Guía Práctica de Solicitudes HTTP (Cuerpos y Cookies)

A continuación se presentan ejemplos prácticos y listos para copiar con cabeceras de cookies y cuerpos JSON para probar los endpoints mediante herramientas como **Postman**, **Insomnia**, **Thunder Client** o comandos **cURL**:

### 1. Iniciar Sesión y Obtener Cookie (`POST /api/sessions/login`)

```http
POST /api/sessions/login HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
  "email": "usuario@deportes.com",
  "password": "Password123!"
}
```

**Ejemplo cURL** (guarda la cookie en `cookies.txt`):
```bash
curl -X POST http://localhost:8080/api/sessions/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@deportes.com","password":"Password123!"}' \
  -c cookies.txt
```

---

### 2. Inscribirse a un Evento / Reservar Cupo (`POST /api/events/:eid/tickets`)
- **Acceso**: Cualquier usuario autenticado.
- **Cabecera**: `Cookie: currentUser=<token_jwt>`.

```http
POST /api/events/66901f4c7d2e8b1a3c4f5a6b/tickets HTTP/1.1
Host: localhost:8080
Content-Type: application/json
Cookie: currentUser=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "quantity": 2
}
```

**Ejemplo cURL**:
```bash
curl -X POST http://localhost:8080/api/events/66901f4c7d2e8b1a3c4f5a6b/tickets \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"quantity": 2}'
```

**Respuesta Exitosa (`201 Created`)**:
```json
{
  "status": "success",
  "message": "Inscripción realizada con éxito",
  "payload": {
    "id": "66905a8b1c2d3e4f5a6b7c99",
    "user": "665f2a9b1c2d3e4f5a6b7c8d",
    "event": "66901f4c7d2e8b1a3c4f5a6b",
    "quantity": 2,
    "reservationCode": "TK-8A9F-L3X2",
    "status": "confirmed",
    "createdAt": "2026-09-16T14:10:00.000Z"
  }
}
```

---

### 3. Consultar Mis Tickets (`GET /api/tickets/my-tickets`)
- **Acceso**: Usuario autenticado (devuelve solo sus tickets con populate del evento).
- **Cabecera**: `Cookie: currentUser=<token_jwt>`.

```http
GET /api/tickets/my-tickets HTTP/1.1
Host: localhost:8080
Cookie: currentUser=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo cURL**:
```bash
curl -X GET http://localhost:8080/api/tickets/my-tickets -b cookies.txt
```

---

### 4. Cancelar Reserva de Ticket (`PATCH /api/tickets/:tid/cancel`)
- **Acceso**: Dueño del ticket o `admin`.
- **Cabecera**: `Cookie: currentUser=<token_jwt>`.

```http
PATCH /api/tickets/66905a8b1c2d3e4f5a6b7c99/cancel HTTP/1.1
Host: localhost:8080
Cookie: currentUser=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo cURL**:
```bash
curl -X PATCH http://localhost:8080/api/tickets/66905a8b1c2d3e4f5a6b7c99/cancel -b cookies.txt
```

---

### 5. Consultar Tickets de un Evento (`GET /api/events/:eid/tickets`)
- **Acceso**: Solo el organizador creador del evento o `admin`.
- **Cabecera**: `Cookie: currentUser=<token_jwt>`.

```http
GET /api/events/66901f4c7d2e8b1a3c4f5a6b/tickets HTTP/1.1
Host: localhost:8080
Cookie: currentUser=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Ejemplo cURL**:
```bash
curl -X GET http://localhost:8080/api/events/66901f4c7d2e8b1a3c4f5a6b/tickets -b cookies.txt
```

---

## 🛠️ Tecnologías Utilizadas

- **Runtime**: [Node.js](https://nodejs.org/) (Módulos ESM - `import/export`)
- **Framework**: [Express.js](https://expressjs.com/)
- **Base de Datos**: [MongoDB](https://www.mongodb.com/) con [Mongoose ODM](https://mongoosejs.com/)
- **Notificaciones por Correo**: [Nodemailer](https://nodemailer.com/)
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
│   │   ├── config.js          # Variables de entorno procesadas por dotenv y config de Nodemailer
│   │   ├── db.js              # Conexión Mongoose a la base de datos
│   │   └── passport.config.js # Estrategias 'register', 'login' y 'current'
│   ├── routes/                # Capa de Enrutamiento
│   │   ├── events.router.js   # Rutas de eventos e inscripciones (/api/events/:eid/tickets)
│   │   ├── tickets.router.js  # Rutas de tickets personales y cancelación (/api/tickets)
│   │   ├── sessions.router.js # Rutas de sesiones (register, login, current, logout)
│   │   └── users.router.js    # Ruta administrativa exclusiva de usuarios
│   ├── controllers/           # Capa de Controladores (Solo req/res)
│   │   ├── events.controller.js
│   │   ├── tickets.controller.js
│   │   ├── sessions.controller.js
│   │   └── users.controller.js
│   ├── services/              # Capa de Lógica de Negocio (Cupos, Propiedad, Validaciones)
│   │   ├── events.service.js
│   │   ├── tickets.service.js
│   │   ├── mail.service.js    # Servicio de envío de emails con Nodemailer
│   │   └── sessions.service.js
│   ├── repositories/          # Capa de Abstracción de Persistencia (Patrón Repository)
│   │   ├── events.repository.js
│   │   ├── tickets.repository.js
│   │   └── users.repository.js
│   ├── dao/                   # Data Access Objects (Consultas directas a Mongoose)
│   │   ├── events.dao.js
│   │   ├── tickets.dao.js
│   │   └── users.dao.js
│   ├── models/                # Modelos y Esquemas Mongoose
│   │   ├── User.js            # Modelo base de Usuario (role: user | organizer | admin)
│   │   ├── Event.js           # Modelo de Evento Deportivo (referencia ObjectId a organizer)
│   │   └── Ticket.js          # Modelo de Ticket/Inscripción (referencias a user y event)
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
├── .env.example               # Ejemplos de variables de entorno (MongoDB, JWT, Nodemailer)
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

# Variables de Nodemailer
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tu_correo@gmail.com
MAIL_PASS=tu_password_de_aplicacion
MAIL_FROM="SportEventHub <noreply@sporteventhub.com>"
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

| Caso de Prueba | Condición Evaluada | Resultado Esperado | Estado |
| :--- | :--- | :---: | :---: |
| **Inscripción sin sesión** | `POST /api/events/:eid/tickets` sin cookie | `401 Unauthorized` | ✅ Superado |
| **Inscripción a evento inexistente** | `POST /api/events/:eid/tickets` con ID inválido | `404 Not Found` | ✅ Superado |
| **Inscripción a evento cancelado** | `POST /api/events/:eid/tickets` en evento no publicado | `400 Bad Request` | ✅ Superado |
| **Inscripción exitosa con cupo** | `POST /api/events/:eid/tickets` con cupo y sesión | `201 Created` + email enviado | ✅ Superado |
| **Inscripción duplicada activa** | Usuario intenta inscribirse dos veces al mismo evento | `400 Bad Request` | ✅ Superado |
| **Inscripción sin cupo suficiente** | Cantidad solicitada supera los cupos disponibles | `400 Bad Request` | ✅ Superado |
| **Cancelación de ticket ajeno** | Usuario intenta cancelar un ticket de otro usuario | `403 Forbidden` | ✅ Superado |
| **Cancelación propia** | Titular cancela su ticket | `200 OK` (`status: cancelled`) | ✅ Superado |
| **Liberación automática de cupo** | Nueva reserva tras cancelación por el cupo liberado | `201 Created` | ✅ Superado |
| **Ver tickets de evento como `user`** | Usuario común intenta consultar lista de inscriptos | `403 Forbidden` | ✅ Superado |
| **Ver tickets de evento ajeno** | Organizador consulta inscriptos de otro organizador | `403 Forbidden` | ✅ Superado |
| **Ver tickets de evento propio** | Organizador dueño consulta sus inscriptos | `200 OK` | ✅ Superado |
| **Consultar mis tickets** | Usuario autenticado consulta `/api/tickets/my-tickets` | `200 OK` (con populate) | ✅ Superado |
