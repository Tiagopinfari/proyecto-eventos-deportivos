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

// In-memory DAOs para pruebas de aceptación reproducibles
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
  async getPaginated({ filter = {}, page = 1, limit = 10, sort = { date: 1 } }) {
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
  constructor() {
    this.emailsSent = [];
  }
  async sendTicketConfirmationEmail(payload) {
    this.emailsSent.push(payload);
    return { messageId: 'mock_mail_' + Date.now() };
  }
}

async function runAcceptanceTests() {
  console.log('\n======================================================================');
  console.log('   VERIFICACIÓN OFICIAL DE ENTREGA FINAL - SPORTEVENTHUB');
  console.log('======================================================================\n');

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

  // Rutas
  app.post('/api/sessions/register', async (req, res, next) => {
    try {
      const user = await sessionsService.registerUser(req.body);
      res.status(201).json({ status: 'success', payload: UserDTO.from(user) });
    } catch (err) { next(err); }
  });

  app.post('/api/sessions/login', async (req, res, next) => {
    try {
      const { user, token } = await sessionsService.loginUser(req.body);
      res.cookie('currentUser', token, { httpOnly: true });
      res.status(200).json({ status: 'success', message: 'Login correcto' });
    } catch (err) { next(err); }
  });

  app.get('/api/sessions/current', authMiddleware, (req, res) => {
    res.status(200).json({ status: 'success', payload: UserDTO.from(req.user) });
  });

  app.post('/api/sessions/logout', (req, res) => {
    res.clearCookie('currentUser');
    res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
  });

  app.get('/api/users', authMiddleware, authorize(['admin']), async (req, res, next) => {
    try {
      const users = await usersService.getAllUsers();
      res.status(200).json({ status: 'success', payload: users });
    } catch (err) { next(err); }
  });

  app.get('/api/events', async (req, res, next) => {
    try {
      const result = await eventsService.fetchAllEvents(req.query);
      res.status(200).json({
        status: 'success',
        data: EventDTO.from(result.data),
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages
      });
    } catch (err) { next(err); }
  });

  app.post('/api/events', authMiddleware, authorize(['organizer', 'admin']), async (req, res, next) => {
    try {
      const event = await eventsService.createNewEvent(req.body, req.user.id);
      res.status(201).json({ status: 'success', payload: EventDTO.from(event) });
    } catch (err) { next(err); }
  });

  app.put('/api/events/:id', authMiddleware, authorize(['organizer', 'admin']), async (req, res, next) => {
    try {
      const updated = await eventsService.updateEvent(req.params.id, req.body, req.user);
      res.status(200).json({ status: 'success', payload: EventDTO.from(updated) });
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
    // -------------------------------------------------------------------------
    // FLUJO 1: Registro → login → /current → logout → /current devuelve 401
    // -------------------------------------------------------------------------
    let userCookie = null;
    let registeredUser = null;
    {
      // 1a. Registro
      const regRes = await fetch(`${baseUrl}/api/sessions/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: 'Santiago',
          last_name: 'López',
          email: 'santiago@deportes.com',
          password: 'Password123!'
        })
      });
      const regJson = await regRes.json();
      registeredUser = regJson.payload;

      // 1b. Login
      const loginRes = await fetch(`${baseUrl}/api/sessions/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'santiago@deportes.com',
          password: 'Password123!'
        })
      });
      userCookie = loginRes.headers.get('set-cookie');

      // 1c. /current con sesión activa
      const currentRes = await fetch(`${baseUrl}/api/sessions/current`, {
        headers: { 'Cookie': userCookie }
      });
      const currentJson = await currentRes.json();

      // 1d. Logout
      const logoutRes = await fetch(`${baseUrl}/api/sessions/logout`, {
        method: 'POST',
        headers: { 'Cookie': userCookie }
      });

      // 1e. /current tras logout -> 401
      const afterLogoutRes = await fetch(`${baseUrl}/api/sessions/current`);

      assert(
        regRes.status === 201 &&
        loginRes.status === 200 &&
        currentRes.status === 200 &&
        currentJson.payload?.email === 'santiago@deportes.com' &&
        logoutRes.status === 200 &&
        afterLogoutRes.status === 401,
        'Flujo 1: Registro → Login → /current (200) → Logout → /current (401)'
      );
    }

    // Tokens de prueba para los distintos roles
    const userToken = generateToken({ id: registeredUser.id, email: registeredUser.email, role: 'user' });
    const user2Token = generateToken({ id: 'usr_competidor2', email: 'competidor2@deportes.com', role: 'user' });
    const orgToken = generateToken({ id: 'org_club_central', email: 'club@central.com', role: 'organizer' });
    const org2Token = generateToken({ id: 'org_club_norte', email: 'club@norte.com', role: 'organizer' });
    const adminToken = generateToken({ id: 'admin_plataforma', email: 'admin@eventos.com', role: 'admin' });

    // -------------------------------------------------------------------------
    // FLUJO 2: user intenta crear evento → 403
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${baseUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `currentUser=${userToken}` },
        body: JSON.stringify({
          title: 'Torneo No Autorizado',
          category: 'Fútbol',
          capacity: 20
        })
      });
      assert(res.status === 403, 'Flujo 2: Rol user intentando crear evento retorna 403 Forbidden');
    }

    // -------------------------------------------------------------------------
    // FLUJO 3: organizer crea evento → user se inscribe → email recibido → cupo descontado
    // -------------------------------------------------------------------------
    let eventId;
    let ticketId;
    {
      // 3a. organizer crea evento
      const evRes = await fetch(`${baseUrl}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `currentUser=${orgToken}` },
        body: JSON.stringify({
          title: 'Torneo Abierto de Tenis 2027',
          description: 'Torneo oficial sobre polvo de ladrillo',
          category: 'Tenis',
          date: '2027-04-10T10:00:00.000Z',
          location: 'Club Central',
          capacity: 2,
          price: 2000
        })
      });
      const evJson = await evRes.json();
      eventId = evJson.payload.id;

      // 3b. user se inscribe
      const tktRes = await fetch(`${baseUrl}/api/events/${eventId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `currentUser=${userToken}` },
        body: JSON.stringify({ quantity: 1 })
      });
      const tktJson = await tktRes.json();
      ticketId = tktJson.payload.id;

      // 3c. Email enviado y cupo descontado
      const emailDispatched = mailService.emailsSent.some(m => m.user?.email === 'santiago@deportes.com');
      const occupied = await ticketsRepo.getOccupiedCapacity(eventId);

      assert(
        evRes.status === 201 &&
        tktRes.status === 201 &&
        emailDispatched &&
        occupied === 1,
        'Flujo 3: Organizer crea evento → User se inscribe → Email recibido → Cupo descontado'
      );
    }

    // -------------------------------------------------------------------------
    // FLUJO 4: user intenta inscribirse nuevamente al mismo evento → error de duplicado (409)
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${baseUrl}/api/events/${eventId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `currentUser=${userToken}` },
        body: JSON.stringify({ quantity: 1 })
      });
      assert(res.status === 409, 'Flujo 4: Inscripción duplicada activa para el mismo usuario retorna 409 Conflict');
    }

    // -------------------------------------------------------------------------
    // FLUJO 5: user intenta inscribirse a evento sin cupo → error claro (400)
    // -------------------------------------------------------------------------
    // Capacidad: 2, Ocupados: 1, Disponibles: 1. User2 solicita 2 cupos -> debe rechazar
    {
      const res = await fetch(`${baseUrl}/api/events/${eventId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `currentUser=${user2Token}` },
        body: JSON.stringify({ quantity: 2 })
      });
      const json = await res.json();
      assert(
        res.status === 400 && json.message.includes('Cupos insuficientes'),
        'Flujo 5: Inscripción sin cupo suficiente retorna 400 Bad Request con mensaje claro'
      );
    }

    // -------------------------------------------------------------------------
    // FLUJO 6: user cancela su ticket → cupo liberado → nueva inscripción funciona
    // -------------------------------------------------------------------------
    {
      // 6a. Cancelar ticket propio
      const cancelRes = await fetch(`${baseUrl}/api/tickets/${ticketId}/cancel`, {
        method: 'PATCH',
        headers: { 'Cookie': `currentUser=${userToken}` }
      });
      const cancelJson = await cancelRes.json();

      // 6b. Ahora que se liberó el cupo, User2 puede pedir los 2 cupos
      const newEnrollRes = await fetch(`${baseUrl}/api/events/${eventId}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `currentUser=${user2Token}` },
        body: JSON.stringify({ quantity: 2 })
      });

      assert(
        cancelRes.status === 200 &&
        cancelJson.payload?.status === 'cancelled' &&
        newEnrollRes.status === 201,
        'Flujo 6: User cancela ticket → Cupo liberado → Nueva inscripción por ese cupo funciona (201)'
      );
    }

    // -------------------------------------------------------------------------
    // FLUJO 7: organizer intenta modificar evento ajeno → 403
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${baseUrl}/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Cookie': `currentUser=${org2Token}` },
        body: JSON.stringify({ title: 'Intento Modificar Evento Ajeno' })
      });
      assert(res.status === 403, 'Flujo 7: Organizer intentando modificar evento ajeno retorna 403 Forbidden');
    }

    // -------------------------------------------------------------------------
    // FLUJO 8: admin modifica evento de otro organizador → éxito (200)
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${baseUrl}/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Cookie': `currentUser=${adminToken}` },
        body: JSON.stringify({ title: 'Torneo Modificado y Aprobado por Admin' })
      });
      const json = await res.json();
      assert(
        res.status === 200 && json.payload?.title === 'Torneo Modificado y Aprobado por Admin',
        'Flujo 8: Admin modifica evento de otro organizador con éxito (200 OK)'
      );
    }

    // -------------------------------------------------------------------------
    // FLUJO 9: Respuestas de usuario, evento y ticket no contienen password
    // -------------------------------------------------------------------------
    {
      const usersRes = await fetch(`${baseUrl}/api/users`, { headers: { 'Cookie': `currentUser=${adminToken}` } });
      const usersJson = await usersRes.json();
      const currentRes = await fetch(`${baseUrl}/api/sessions/current`, { headers: { 'Cookie': `currentUser=${userToken}` } });
      const currentJson = await currentRes.json();
      const myTicketsRes = await fetch(`${baseUrl}/api/tickets/my-tickets`, { headers: { 'Cookie': `currentUser=${user2Token}` } });
      const myTicketsJson = await myTicketsRes.json();

      const noPasswordsInUsers = usersJson.payload.every(u => u.password === undefined);
      const noPasswordInCurrent = currentJson.payload.password === undefined;
      const noPasswordInTickets = myTicketsJson.payload.every(t => !t.user?.password && !t.event?.organizer?.password);

      assert(
        noPasswordsInUsers && noPasswordInCurrent && noPasswordInTickets,
        'Flujo 9: Respuestas de usuario, evento y ticket pasan por DTO y NUNCA contienen password'
      );
    }

    // -------------------------------------------------------------------------
    // FLUJO 10: Listado de eventos con ?status=published&page=2&limit=5 devuelve estructura paginada
    // -------------------------------------------------------------------------
    {
      // Insertar algunos eventos publicados adicionales para validar paginación real
      for (let i = 1; i <= 6; i++) {
        await eventsDao.create({
          title: `Evento de Prueba Paginación ${i}`,
          category: 'Running',
          status: 'published',
          date: new Date('2027-05-01'),
          capacity: 50
        });
      }

      const res = await fetch(`${baseUrl}/api/events?status=published&page=2&limit=5`);
      const json = await res.json();

      assert(
        res.status === 200 &&
        Array.isArray(json.data) &&
        json.page === 2 &&
        json.limit === 5 &&
        typeof json.total === 'number' &&
        typeof json.totalPages === 'number' &&
        json.totalPages >= 2,
        'Flujo 10: Listado con ?status=published&page=2&limit=5 devuelve estructura { data, page, limit, total, totalPages }'
      );
    }

  } finally {
    server.close();
  }

  console.log('\n======================================================================');
  console.log(`   RESUMEN FINAL: ${passed} PASADAS | ${failed} FALLIDAS`);
  console.log('======================================================================\n');

  if (failed > 0) process.exit(1);
}

runAcceptanceTests().catch(err => {
  console.error('Error fatal durante la verificación:', err);
  process.exit(1);
});
