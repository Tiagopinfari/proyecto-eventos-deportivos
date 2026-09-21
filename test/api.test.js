import express from 'express';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import initializePassport from '../src/config/passport.config.js';
import { generateToken } from '../src/utils/jwt.js';
import { SessionsService } from '../src/services/sessions.service.js';
import { UsersService } from '../src/services/users.service.js';
import { EventsService } from '../src/services/events.service.js';
import { TicketsService } from '../src/services/tickets.service.js';
import { UserDTO } from '../src/dto/user.dto.js';
import { EventDTO } from '../src/dto/event.dto.js';
import { TicketDTO } from '../src/dto/ticket.dto.js';
import errorHandlerMiddleware from '../src/middlewares/error.middleware.js';
import { authMiddleware } from '../src/middlewares/auth.middleware.js';
import { authorize } from '../src/middlewares/authorize.middleware.js';

// In-memory DAOs para tests automatizados independientes
class InMemoryUsersDao {
  constructor() {
    this.users = [];
  }
  async getAll() { return [...this.users]; }
  async getById(id) { return this.users.find(u => u.id === id) || null; }
  async getByEmail(email) { return this.users.find(u => u.email === email) || null; }
  async create(data) {
    const user = { id: 'usr_' + Math.random().toString(36).substring(2, 7), ...data };
    this.users.push(user);
    return { ...user };
  }
}

class InMemoryEventsDao {
  constructor() {
    this.events = [];
  }
  async getById(id) { return this.events.find(e => e.id === id) || null; }
  async create(data) {
    const event = { id: 'evt_' + Math.random().toString(36).substring(2, 7), ...data };
    this.events.push(event);
    return { ...event };
  }
  async getPaginated({ filter, page = 1, limit = 10 }) {
    let filtered = [...this.events];
    if (filter.status) filtered = filtered.filter(e => e.status === filter.status);
    const total = filtered.length;
    const data = filtered.slice((page - 1) * limit, page * limit);
    return { data, page, limit, total, totalPages: Math.ceil(total / limit) || 1 };
  }
  async update(id, data) {
    const idx = this.events.findIndex(e => e.id === id);
    if (idx === -1) return null;
    this.events[idx] = { ...this.events[idx], ...data };
    return { ...this.events[idx] };
  }
}

class InMemoryTicketsDao {
  constructor() {
    this.tickets = [];
  }
  async create(data) {
    const ticket = { id: 'tkt_' + Math.random().toString(36).substring(2, 7), ...data, createdAt: new Date() };
    this.tickets.push(ticket);
    return { ...ticket };
  }
  async getById(id) { return this.tickets.find(t => t.id === id) || null; }
  async getByUser(userId) { return this.tickets.filter(t => t.user === userId); }
  async getByEvent(eventId) { return this.tickets.filter(t => t.event === eventId); }
  async getActiveUserTicket(userId, eventId) {
    return this.tickets.find(t => t.user === userId && t.event === eventId && ['confirmed', 'pending'].includes(t.status)) || null;
  }
  async getOccupiedCapacity(eventId) {
    return this.tickets
      .filter(t => t.event === eventId && t.status !== 'cancelled')
      .reduce((acc, t) => acc + (t.quantity || 1), 0);
  }
  async update(id, data) {
    const idx = this.tickets.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.tickets[idx] = { ...this.tickets[idx], ...data };
    return { ...this.tickets[idx] };
  }
  async cancel(id) {
    return await this.update(id, { status: 'cancelled', cancelledAt: new Date() });
  }
}

class MockMailService {
  async sendTicketConfirmationEmail() { return { messageId: 'test_mail_ok' }; }
}

async function runAcceptanceTests() {
  console.log('\n======================================================');
  console.log('   SUITE DE TESTS AUTOMATIZADOS - SPORTEVENTHUB');
  console.log('======================================================\n');

  const usersDao = new InMemoryUsersDao();
  const eventsDao = new InMemoryEventsDao();
  const ticketsDao = new InMemoryTicketsDao();
  const mailService = new MockMailService();

  const usersRepo = {
    getUsers: (f) => usersDao.getAll(f),
    getUserById: (id) => usersDao.getById(id),
    getUserByEmail: (e) => usersDao.getByEmail(e),
    createUser: (d) => usersDao.create(d)
  };

  const eventsRepo = {
    getEventById: (id) => eventsDao.getById(id),
    createEvent: (d) => eventsDao.create(d),
    getPaginatedEvents: (opts) => eventsDao.getPaginated(opts),
    updateEvent: (id, d) => eventsDao.update(id, d),
    softDeleteEvent: (id) => eventsDao.update(id, { status: 'cancelled' })
  };

  const ticketsRepo = {
    createTicket: (d) => ticketsDao.create(d),
    getTicketById: (id) => ticketsDao.getById(id),
    getTicketsByUser: (u) => ticketsDao.getByUser(u),
    getTicketsByEvent: (e) => ticketsDao.getByEvent(e),
    getActiveUserTicket: (u, e) => ticketsDao.getActiveUserTicket(u, e),
    getOccupiedCapacity: (e) => ticketsDao.getOccupiedCapacity(e),
    cancelTicket: (id) => ticketsDao.cancel(id)
  };

  const sessionsService = new SessionsService(usersRepo);
  const usersService = new UsersService(usersRepo);
  const eventsService = new EventsService(eventsRepo);
  const ticketsService = new TicketsService(ticketsRepo, eventsRepo, mailService);

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  initializePassport();
  app.use(passport.initialize());

  // Endpoints configurados con DTOs y Servicios
  app.post('/api/sessions/register', async (req, res, next) => {
    try {
      const user = await sessionsService.registerUser(req.body);
      res.status(201).json({ status: 'success', payload: UserDTO.from(user) });
    } catch (err) { next(err); }
  });

  app.get('/api/sessions/current', authMiddleware, (req, res) => {
    res.status(200).json({ status: 'success', payload: UserDTO.from(req.user) });
  });

  app.get('/api/users', authMiddleware, authorize(['admin']), async (req, res, next) => {
    try {
      const users = await usersService.getAllUsers();
      res.status(200).json({ status: 'success', payload: users });
    } catch (err) { next(err); }
  });

  app.post('/api/events', authMiddleware, authorize(['organizer', 'admin']), async (req, res, next) => {
    try {
      const event = await eventsService.createNewEvent(req.body, req.user.id);
      res.status(201).json({ status: 'success', payload: EventDTO.from(event) });
    } catch (err) { next(err); }
  });

  app.post('/api/events/:eid/tickets', authMiddleware, async (req, res, next) => {
    try {
      const ticket = await ticketsService.createTicket({ eventId: req.params.eid, user: req.user, quantity: req.body.quantity });
      res.status(201).json({ status: 'success', payload: TicketDTO.from(ticket) });
    } catch (err) { next(err); }
  });

  app.get('/api/tickets/my-tickets', authMiddleware, async (req, res, next) => {
    try {
      const tickets = await ticketsService.getUserTickets(req.user.id);
      res.status(200).json({ status: 'success', payload: tickets });
    } catch (err) { next(err); }
  });

  app.get('/api/events/:eid/tickets', authMiddleware, authorize(['organizer', 'admin']), async (req, res, next) => {
    try {
      const tickets = await ticketsService.getEventTickets(req.params.eid, req.user);
      res.status(200).json({ status: 'success', payload: tickets });
    } catch (err) { next(err); }
  });

  app.patch('/api/tickets/:tid/cancel', authMiddleware, async (req, res, next) => {
    try {
      const cancelled = await ticketsService.cancelTicket(req.params.tid, req.user);
      res.status(200).json({ status: 'success', payload: cancelled });
    } catch (err) { next(err); }
  });

  app.use(errorHandlerMiddleware);

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  let passed = 0;
  let failed = 0;

  function assert(cond, name, details = '') {
    if (cond) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${details}`);
      failed++;
    }
  }

  try {
    // 1. Registro seguro con DTO sin password
    let registeredUser;
    {
      const res = await fetch(`${baseUrl}/api/sessions/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: 'Carlos',
          last_name: 'Pérez',
          email: 'carlos@test.com',
          password: 'Password123!'
        })
      });
      const json = await res.json();
      registeredUser = json.payload;
      assert(
        res.status === 201 &&
        registeredUser.id &&
        registeredUser.email === 'carlos@test.com' &&
        registeredUser.password === undefined,
        '1. Registro exitoso devuelve UserDTO sin campo password'
      );
    }

    // Tokens para las pruebas
    const userToken = generateToken({ id: registeredUser.id, email: registeredUser.email, role: 'user' });
    const user2Token = generateToken({ id: 'usr_other', email: 'other@test.com', role: 'user' });
    const organizerToken = generateToken({ id: 'org_1', email: 'organizer@test.com', role: 'organizer' });
    const organizer2Token = generateToken({ id: 'org_2', email: 'organizer2@test.com', role: 'organizer' });
    const adminToken = generateToken({ id: 'admin_1', email: 'admin@test.com', role: 'admin' });

    // 2. Respuesta de /current no incluye password
    {
      const res = await fetch(`${baseUrl}/api/sessions/current`, {
        headers: { 'Cookie': `currentUser=${userToken}` }
      });
      const json = await res.json();
      assert(
        res.status === 200 &&
        json.payload.email === 'carlos@test.com' &&
        json.payload.password === undefined,
        '2. Endpoint /current devuelve UserDTO seguro sin password'
      );
    }

    // 3. Consulta de usuarios solo admin y mediante DTO
    {
      const res = await fetch(`${baseUrl}/api/users`, {
        headers: { 'Cookie': `currentUser=${adminToken}` }
      });
      const json = await res.json();
      const everyUserSafe = json.payload.every(u => u.password === undefined && u.email);
      assert(
        res.status === 200 && Array.isArray(json.payload) && everyUserSafe,
        '3. Endpoint /api/users devuelve lista de UserDTOs sin contraseñas'
      );
    }

    // 4. Intento de crear evento con rol user -> 403
    {
      const res = await fetch(`${baseUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `currentUser=${userToken}` },
        body: JSON.stringify({ title: 'Torneo Prohibido', category: 'Tenis', capacity: 10 })
      });
      assert(res.status === 403, '4. Intento de crear evento con rol user retorna 403 Forbidden');
    }

    // 5. Creación de evento exitoso con rol organizer y fecha futura
    let eventId;
    {
      const res = await fetch(`${baseUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `currentUser=${organizerToken}` },
        body: JSON.stringify({
          title: 'Torneo Maratón Verano 2027',
          description: 'Competencia 10k y 21k',
          category: 'Running',
          date: '2027-02-15T09:00:00.000Z',
          location: 'Costanera',
          capacity: 3,
          price: 1500
        })
      });
      const json = await res.json();
      eventId = json.payload.id;
      assert(
        res.status === 201 && json.payload.title === 'Torneo Maratón Verano 2027',
        '5. Creación de evento con rol organizer retorna 201 y EventDTO'
      );
    }

    // 6. Rechazo de evento con fecha pasada
    {
      const res = await fetch(`${baseUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `currentUser=${organizerToken}` },
        body: JSON.stringify({
          title: 'Evento Pasado',
          description: 'Fecha en 2020',
          category: 'Running',
          date: '2020-01-01T09:00:00.000Z',
          location: 'Parque',
          capacity: 10
        })
      });
      assert(res.status === 400, '6. Creación de evento con fecha pasada retorna 400 Bad Request');
    }

    // 7. Reserva de cupo / ticket exitosa -> 201 y TicketDTO
    let ticketId;
    {
      const res = await fetch(`${baseUrl}/api/events/${eventId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `currentUser=${userToken}` },
        body: JSON.stringify({ quantity: 1 })
      });
      const json = await res.json();
      ticketId = json.payload.id;
      assert(
        res.status === 201 &&
        json.payload.reservationCode?.startsWith('TK-') &&
        json.payload.status === 'confirmed',
        '7. Reserva de ticket retorna 201 y TicketDTO con código de reserva'
      );
    }

    // 8. Control de fecha vigente: rechazo de inscripción si event.date <= Date.now()
    {
      const pastEvent = await eventsDao.create({
        title: 'Torneo Antiguo Cerrado',
        category: 'Paddle',
        capacity: 10,
        status: 'published',
        date: new Date('2020-05-01')
      });

      const res = await fetch(`${baseUrl}/api/events/${pastEvent.id}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `currentUser=${userToken}` },
        body: JSON.stringify({ quantity: 1 })
      });
      const json = await res.json();
      assert(
        res.status === 400 && json.message.includes('pasó o ha finalizado'),
        '8. Reserva de cupo en evento pasado rechazada con 400 Bad Request (Control de fecha vigente)'
      );
    }

    // 9. Prevención de inscripciones duplicadas -> 409 Conflict
    {
      const res = await fetch(`${baseUrl}/api/events/${eventId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `currentUser=${userToken}` },
        body: JSON.stringify({ quantity: 1 })
      });
      assert(
        res.status === 409,
        '9. Inscripción duplicada activa para el mismo usuario y evento retorna 409 Conflict'
      );
    }

    // 10. Rechazo por cupos insuficientes -> 400
    // Evento tiene capacidad: 3, ocupados: 1. Quedan 2. Solicitamos 5.
    {
      const res = await fetch(`${baseUrl}/api/events/${eventId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `currentUser=${user2Token}` },
        body: JSON.stringify({ quantity: 5 })
      });
      assert(
        res.status === 400,
        '10. Solicitud de cupos superior a los disponibles retorna 400 Bad Request'
      );
    }

    // 11. Consulta de mis tickets -> 200 y TicketDTO
    {
      const res = await fetch(`${baseUrl}/api/tickets/my-tickets`, {
        headers: { 'Cookie': `currentUser=${userToken}` }
      });
      const json = await res.json();
      assert(
        res.status === 200 && Array.isArray(json.payload) && json.payload.length === 1,
        '11. Endpoint /api/tickets/my-tickets retorna tickets del usuario formateados'
      );
    }

    // 12. Cancelación de ticket ajeno -> 403 Forbidden
    {
      const res = await fetch(`${baseUrl}/api/tickets/${ticketId}/cancel`, {
        method: 'PATCH',
        headers: { 'Cookie': `currentUser=${user2Token}` }
      });
      assert(res.status === 403, '12. Cancelación de ticket de otro usuario retorna 403 Forbidden');
    }

    // 13. Cancelación de ticket propio -> 200 OK y liberación de cupo
    {
      const res = await fetch(`${baseUrl}/api/tickets/${ticketId}/cancel`, {
        method: 'PATCH',
        headers: { 'Cookie': `currentUser=${userToken}` }
      });
      const json = await res.json();
      assert(
        res.status === 200 && json.payload.status === 'cancelled',
        '13. Cancelación de ticket propio retorna 200 y status: cancelled'
      );
    }

    // 14. Consulta de tickets de un evento por organizador ajeno -> 403
    {
      const res = await fetch(`${baseUrl}/api/events/${eventId}/tickets`, {
        headers: { 'Cookie': `currentUser=${organizer2Token}` }
      });
      assert(
        res.status === 403,
        '14. Consulta de tickets de evento ajeno por otro organizador retorna 403 Forbidden'
      );
    }

    // 15. Acceso sin sesión -> 401 Unauthorized
    {
      const res = await fetch(`${baseUrl}/api/tickets/my-tickets`);
      assert(res.status === 401, '15. Acceso a ruta protegida sin sesión retorna 401 Unauthorized');
    }

  } finally {
    server.close();
  }

  console.log('\n======================================================');
  console.log(`   RESULTADOS: ${passed} PASADAS | ${failed} FALLIDAS`);
  console.log('======================================================\n');

  if (failed > 0) process.exit(1);
}

runAcceptanceTests().catch(err => {
  console.error('Error fatal durante la ejecución de los tests:', err);
  process.exit(1);
});
