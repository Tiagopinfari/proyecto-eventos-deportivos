# 🏆 SportEventHub - Plataforma de Eventos Deportivos (API Backend)

¡Bienvenido a **SportEventHub**! Este proyecto es la API backend para una plataforma de gestión de eventos deportivos, inscripciones y tickets/cupos. Permite organizar torneos, maratones, partidos, competencias y talleres deportivos, conectando a deportistas con organizadores.

Este desarrollo corresponde al proyecto final de **Backend II**, implementando una arquitectura profesional por capas con el patrón **DAO (Data Access Object)**, **Repository**, **Services**, **Controllers**, **DTOs (Data Transfer Objects)**, Middlewares, Autenticación centralizada mediante **Passport.js**, **JWT en cookies HttpOnly**, Hashing de contraseñas con `bcrypt`, **Control de Acceso Basado en Roles (RBAC)**, CRUD de Eventos, **Flujo completo de Inscripciones y Tickets con Control de Cupos en tiempo real** y **Notificaciones por Email con Nodemailer**.

---

## 🏛️ Arquitectura por Capas y Separación de Responsabilidades

El sistema adopta una arquitectura formal en capas desacopladas, asegurando que cada componente tenga una única responsabilidad bien definida:

```text
               ┌──────────────────────────────┐
               │    Cliente HTTP (Postman /   │
               │      cURL / Navegador)       │
               └──────────────┬───────────────┘
                              │ Petición HTTP
                              ▼
               ┌──────────────────────────────┐
               │         Middlewares          │
               │ (Auth, RBAC, Logging, Error) │
               └──────────────┬───────────────┘
                              │
                              ▼
               ┌──────────────────────────────┐
               │          Controllers         │
               │ (Solo orquesta req/res y DTO)│
               └──────────────┬───────────────┘
                              │ Llama al Service
                              ▼
               ┌──────────────────────────────┐
               │           Services           │
               │ (Lógica de negocio, cupos,   │
               │  fechas, permisos y emails)  │
               └──────────────┬───────────────┘
                              │ Consume Repository
                              ▼
               ┌──────────────────────────────┐
               │         Repositories         │
               │ (Abstracción de dominio de   │
               │  persistencia de datos)      │
               └──────────────┬───────────────┘
                              │ Consume DAO
                              ▼
               ┌──────────────────────────────┐
               │             DAOs             │
               │ (Única capa que interactúa   │
               │  con modelos Mongoose)       │
               └──────────────┬───────────────┘
                              │ Consultas ODM
                              ▼
               ┌──────────────────────────────┐
               │        Base de Datos         │
               │       (MongoDB Atlas)        │
               └──────────────────────────────┘
```

### 1. Capa DAO (Data Access Object)
- **Archivos**: `src/dao/users.dao.js`, `src/dao/events.dao.js`, `src/dao/tickets.dao.js`.
- **Responsabilidad**: Es la **única capa que importa modelos de Mongoose directamente**. Se encarga exclusivamente de las operaciones atómicas de lectura, escritura y agregación sobre la base de datos (`findById`, `findOne`, `create`, `update`, `countDocuments`, `aggregate`).

### 2. Capa Repository
- **Archivos**: `src/repositories/users.repository.js`, `src/repositories/events.repository.js`, `src/repositories/tickets.repository.js`.
- **Responsabilidad**: Abstrae el origen de datos proveyendo una interfaz orientada al dominio del negocio. **No importa modelos de Mongoose**; consume únicamente los DAOs correspondientes y expone métodos semánticos (`findByEmail`, `getPaginatedEvents`, `getActiveUserTicket`, `getOccupiedCapacity`, `cancelTicket`).

### 3. Capa Services (Lógica de Negocio)
- **Archivos**: `src/services/sessions.service.js`, `src/services/users.service.js`, `src/services/events.service.js`, `src/services/tickets.service.js`, `src/services/mail.service.js`.
- **Responsabilidad**: Concentra **todas las reglas de negocio del sistema**. Consumen repositorios (nunca DAOs ni modelos directamente).
  - Validación de existencia y estados de eventos (`published`).
  - **Validación de fechas válidas y vigentes**: impide crear eventos en el pasado y reservar cupos en eventos cuya fecha ya pasó (`event.date > Date.now()`).
  - Control de cupos en tiempo real excluyendo tickets cancelados.
  - Prevención de inscripciones duplicadas activas por usuario.
  - Verificación de permisos sobre recursos propios y despacho de notificaciones vía Nodemailer.

### 4. Capa Controllers
- **Archivos**: `src/controllers/sessions.controller.js`, `src/controllers/users.controller.js`, `src/controllers/events.controller.js`, `src/controllers/tickets.controller.js`.
- **Responsabilidad**: Coordinan exclusivamente el ciclo de petición y respuesta HTTP. Extraen parámetros (`params`, `query`, `body`, `user`), invocan el método correspondiente del servicio y estructuran la respuesta aplicando los **DTOs**. No contienen lógica de negocio ni importan modelos.

### 5. Capa DTO (Data Transfer Objects)
- **Archivos**: `src/dto/user.dto.js`, `src/dto/event.dto.js`, `src/dto/ticket.dto.js`.
- **Responsabilidad**: Garantizan la seguridad y consistencia en las respuestas enviadas al cliente:
  - **`UserDTO`**: Oculta de forma estricta cualquier campo `password` (incluso el hash) en todas las rutas (`/current`, `/register`, `/api/users`).
  - **`EventDTO`**: Normaliza los campos del evento y filtra datos sensibles del organizador si viene populado.
  - **`TicketDTO`**: Filtra los documentos relacionados (`user` y `event`), impidiendo la exposición de contraseñas u otros datos privados.

---

## 📌 Roles del Sistema y Matriz de Permisos

El sistema cuenta con tres roles claramente diferenciados:
- **`user`**: Deportista o participante común. Puede consultar eventos publicados, inscribirse a eventos, consultar sus propios tickets y cancelarlos.
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
| **Inscribirse a un evento (Ticket)** | `POST /api/events/:eid/tickets` | Cualquier usuario autenticado | Valida fecha vigente, evento publicado, no duplicados y cupos disponibles. Envía email de confirmación. |
| **Consultar mis tickets** | `GET /api/tickets/my-tickets` | Cualquier usuario autenticado | Retorna exclusivamente los tickets propios con datos del evento vía `populate`. |
| **Consultar tickets de un evento** | `GET /api/events/:eid/tickets` | Dueño (`organizer`) o `admin` | Lista inscriptos al evento. `403` para usuarios comunes u organizadores ajenos. |
| **Cancelar ticket (Reserva)** | `PATCH /api/tickets/:tid/cancel` | Dueño del ticket o `admin` | Marca `cancelled`, registra `cancelledAt` y libera el cupo automáticamente. |
| **Ver perfil propio autenticado** | `GET /api/sessions/current` | Cualquier usuario autenticado | Retorna `{ id, email, role }` mediante `UserDTO`. `401` si no hay sesión. |
| **Ver todos los usuarios** | `GET /api/users` | `admin` | Exclusivo para administradores. `403` para otros roles. |

---

## 🛑 Manejo Centralizado de Errores y Códigos HTTP

El middleware centralizado (`src/middlewares/error.middleware.js`) asegura respuestas consistentes en toda la API mediante los siguientes códigos estándar:

- **`400 Bad Request`**: Datos inválidos, parámetros faltantes o violación de reglas de negocio (ej. cupos insuficientes, fecha de evento pasada o evento cancelado).
- **`401 Unauthorized`**: Falta de autenticación, token ausente o credenciales inválidas.
- **`403 Forbidden`**: Usuario autenticado que intenta realizar una acción o modificar un recurso ajeno fuera de sus permisos de rol.
- **`404 Not Found`**: El recurso solicitado (evento, ticket o usuario) no existe en la base de datos.
- **`409 Conflict`**: Conflicto con el estado actual del recurso (ej. correo electrónico ya registrado o inscripción duplicada activa para un mismo evento).
- **`500 Internal Server Error`**: Excepciones no controladas o fallos imprevistos del servidor.

---

## 🎟️ Entidad `Ticket`, Control de Cupos y Reglas de Negocio

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
   - **Estado publicado**: El evento debe tener `status === 'published'`. No se permite reservar en eventos en estado `draft`, `cancelled` o `finished` (`400 Bad Request`).
   - **Control de fecha válida y vigente**: La fecha del evento debe ser futura (`event.date > Date.now()`). Se rechaza la reserva si el evento ya se llevó a cabo (`400 Bad Request`).
   - **Cantidad válida**: `quantity` debe ser un número entero mayor a 0 (`quantity > 0`).
   - **Prevención de inscripciones duplicadas**: Un usuario no puede tener más de un ticket activo (`confirmed` o `pending`) para un mismo evento (`409 Conflict`).
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

Ejemplos listos para copiar con cabeceras de cookies y cuerpos JSON para probar los endpoints mediante herramientas como **Postman**, **Insomnia**, **Thunder Client** o comandos **cURL**:

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

---

### 3. Consultar Mis Tickets (`GET /api/tickets/my-tickets`)
- **Acceso**: Usuario autenticado (devuelve solo sus tickets mediante `TicketDTO` con populate del evento).
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

## 🛠️ Tecnologías Utilizadas

- **Runtime**: [Node.js](https://nodejs.org/) (Módulos ESM - `import/export`)
- **Framework**: [Express.js](https://expressjs.com/)
- **Base de Datos**: [MongoDB](https://www.mongodb.com/) con [Mongoose ODM](https://mongoosejs.com/)
- **Notificaciones por Correo**: [Nodemailer](https://nodemailer.com/)
- **Autenticación y Autorización**: [Passport.js](http://www.passportjs.org/) (`passport-local`, `passport-jwt`), [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken), [cookie-parser](https://www.npmjs.com/package/cookie-parser), [bcryptjs](https://www.npmjs.com/package/bcryptjs)
- **Variables de Entorno**: [dotenv](https://www.npmjs.com/package/dotenv)

---

## 📂 Estructura del Proyecto

```text
proyecto-eventos-deportivos/
├── src/
│   ├── app.js                 # Configuración de Express, middlewares y rutas
│   ├── server.js              # Punto de entrada y conexión a MongoDB
│   ├── config/                # Ajustes de entorno, base de datos y Passport
│   │   ├── config.js          # Variables de entorno procesadas por dotenv
│   │   ├── db.js              # Conexión Mongoose
│   │   └── passport.config.js # Estrategias 'register', 'login' y 'current'
│   ├── dto/                   # Data Transfer Objects (Capa de Sanitización)
│   │   ├── user.dto.js        # UserDTO: Oculta contraseñas estrictamente
│   │   ├── event.dto.js       # EventDTO: Sanitiza organizador y evento
│   │   └── ticket.dto.js      # TicketDTO: Filtra usuarios y eventos populados
│   ├── routes/                # Capa de Enrutamiento
│   │   ├── events.router.js   # Rutas de eventos e inscripciones
│   │   ├── tickets.router.js  # Rutas de tickets personales y cancelación
│   │   ├── sessions.router.js # Rutas de sesiones
│   │   └── users.router.js    # Ruta administrativa de usuarios
│   ├── controllers/           # Capa de Controladores (Solo coordina HTTP con DTOs)
│   │   ├── events.controller.js
│   │   ├── tickets.controller.js
│   │   ├── sessions.controller.js
│   │   └── users.controller.js
│   ├── services/              # Capa de Lógica de Negocio (Reglas, Cupos, Fechas)
│   │   ├── events.service.js
│   │   ├── tickets.service.js
│   │   ├── users.service.js   # Servicio de usuarios
│   │   ├── mail.service.js    # Servicio de envío de emails con Nodemailer
│   │   └── sessions.service.js
│   ├── repositories/          # Capa Repository (Abstracción de dominio)
│   │   ├── events.repository.js
│   │   ├── tickets.repository.js
│   │   └── users.repository.js
│   ├── dao/                   # Capa DAO (Única que toca modelos Mongoose)
│   │   ├── events.dao.js
│   │   ├── tickets.dao.js
│   │   └── users.dao.js
│   ├── models/                # Esquemas y Modelos de Mongoose
│   │   ├── User.js            # Modelo de Usuario
│   │   ├── Event.js           # Modelo de Evento Deportivo
│   │   └── Ticket.js          # Modelo de Ticket
│   ├── middlewares/           # Middlewares globales y de seguridad
│   │   ├── auth.middleware.js      # Valida sesión activa (401)
│   │   ├── authorize.middleware.js # Valida roles permitidos (403)
│   │   ├── logger.middleware.js    # Logging de solicitudes HTTP
│   │   └── error.middleware.js     # Manejador centralizado de errores
│   └── utils/                 # Herramientas compartidas
│       ├── jwt.js             # Generación y verificación de tokens JWT
│       ├── hash.js            # Hashing con bcryptjs
│       ├── custom-error.js    # Excepciones con código de estado HTTP
│       └── response-handler.js# Respuestas JSON estandarizadas
├── test/
│   └── api.test.js            # Suite de pruebas automatizadas de aceptación
├── .env.example               # Variables de entorno documentadas
├── .gitignore                 # Exclusión de archivos sensibles
├── package.json               # Dependencias y scripts de ejecución y test
└── README.md                  # Documentación exhaustiva del proyecto
```

---

## 🚀 Cómo Ejecutar la Aplicación

### 1. Clonar el repositorio e instalar dependencias

```bash
git clone https://github.com/Tiagopinfari/proyecto-eventos-deportivos.git
cd proyecto-eventos-deportivos
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
PORT=8080
NODE_ENV=development
MONGO_URL=mongodb+srv://<usuario>:<password>@cluster0.example.mongodb.net/eventos_deportivos?retryWrites=true&w=majority
JWT_SECRET=tu_secreto_super_seguro_jwt_backend2
JWT_EXPIRES_IN=1h

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tu_correo@gmail.com
MAIL_PASS=tu_password_de_aplicacion
MAIL_FROM="SportEventHub <noreply@sporteventhub.com>"
```

### 3. Iniciar el servidor

```bash
# Modo desarrollo con recarga automática:
npm run dev

# Modo producción:
npm start
```

---

## 🧪 Ejecución de Tests Automatizados

Para ejecutar la suite de pruebas automatizadas que valida la arquitectura completa, seguridad de contraseñas, control de fechas vigentes y de cupos:

```bash
npm test
```

### Resultados de la Suite Automatizada:

```text
======================================================
   SUITE DE TESTS AUTOMATIZADOS - SPORTEVENTHUB
======================================================

✅ [PASS] 1. Registro exitoso devuelve UserDTO sin campo password
✅ [PASS] 2. Endpoint /current devuelve UserDTO seguro sin password
✅ [PASS] 3. Endpoint /api/users devuelve lista de UserDTOs sin contraseñas
✅ [PASS] 4. Intento de crear evento con rol user retorna 403 Forbidden
✅ [PASS] 5. Creación de evento con rol organizer retorna 201 y EventDTO
✅ [PASS] 6. Creación de evento con fecha pasada retorna 400 Bad Request
✅ [PASS] 7. Reserva de ticket retorna 201 y TicketDTO con código de reserva
✅ [PASS] 8. Reserva de cupo en evento pasado rechazada con 400 Bad Request (Control de fecha vigente)
✅ [PASS] 9. Inscripción duplicada activa para el mismo usuario y evento retorna 409 Conflict
✅ [PASS] 10. Solicitud de cupos superior a los disponibles retorna 400 Bad Request
✅ [PASS] 11. Endpoint /api/tickets/my-tickets retorna tickets del usuario formateados
✅ [PASS] 12. Cancelación de ticket de otro usuario retorna 403 Forbidden
✅ [PASS] 13. Cancelación de ticket propio retorna 200 y status: cancelled
✅ [PASS] 14. Consulta de tickets de evento ajeno por otro organizador retorna 403 Forbidden
✅ [PASS] 15. Acceso a ruta protegida sin sesión retorna 401 Unauthorized

======================================================
   RESULTADOS: 15 PASADAS | 0 FALLIDAS
======================================================
```
