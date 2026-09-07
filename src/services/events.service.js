import eventsRepository from '../repositories/events.repository.js';
import CustomError from '../utils/custom-error.js';

export class EventsService {
  constructor(repository = eventsRepository) {
    this.repository = repository;
  }

  /**
   * Obtiene eventos paginados con filtros multicriterio y ordenamiento
   */
  async fetchAllEvents(queryParams = {}) {
    const {
      status,
      category,
      location,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
      sort
    } = queryParams;

    const filter = {};

    // Filtro por status
    if (status) {
      filter.status = status;
    }

    // Filtro por categoría (case-insensitive)
    if (category) {
      filter.category = { $regex: category.trim(), $options: 'i' };
    }

    // Filtro por ubicación (case-insensitive)
    if (location) {
      filter.location = { $regex: location.trim(), $options: 'i' };
    }

    // Filtro por rango de fechas
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (isNaN(from.getTime())) {
          throw new CustomError('Parámetro dateFrom inválido', 400);
        }
        filter.date.$gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (isNaN(to.getTime())) {
          throw new CustomError('Parámetro dateTo inválido', 400);
        }
        if (typeof dateTo === 'string' && dateTo.length === 10) {
          to.setUTCHours(23, 59, 59, 999);
        }
        filter.date.$lte = to;
      }
    }

    // Configuración de ordenamiento (por defecto fecha ascendente)
    let sortOption = { date: 1 };
    if (sort) {
      if (sort === 'date' || sort === 'asc') {
        sortOption = { date: 1 };
      } else if (sort === '-date' || sort === 'desc') {
        sortOption = { date: -1 };
      } else if (sort === 'price') {
        sortOption = { price: 1 };
      } else if (sort === '-price') {
        sortOption = { price: -1 };
      } else if (sort.startsWith('-')) {
        sortOption = { [sort.substring(1)]: -1 };
      } else {
        sortOption = { [sort]: 1 };
      }
    }

    return await this.repository.getPaginatedEvents({
      filter,
      page,
      limit,
      sort: sortOption
    });
  }

  /**
   * Obtiene un evento por ID
   */
  async fetchEventById(id) {
    const event = await this.repository.getEventById(id);
    if (!event) {
      throw new CustomError(`Evento deportivo con ID ${id} no encontrado`, 404);
    }
    return event;
  }

  /**
   * Crea un nuevo evento asignando el organizador desde el usuario autenticado
   */
  async createNewEvent(eventData, organizerId) {
    const {
      title,
      description,
      category,
      sport_category,
      date,
      location,
      capacity,
      price,
      status = 'published'
    } = eventData || {};

    const finalCategory = category || sport_category;

    // Validación de presencia de campos obligatorios
    if (!title || !title.trim()) {
      throw new CustomError('El título es obligatorio', 400);
    }
    if (!description || !description.trim()) {
      throw new CustomError('La descripción es obligatoria', 400);
    }
    if (!finalCategory || !finalCategory.trim()) {
      throw new CustomError('La categoría es obligatoria', 400);
    }
    if (!location || !location.trim()) {
      throw new CustomError('La ubicación es obligatoria', 400);
    }
    if (!date) {
      throw new CustomError('La fecha del evento es obligatoria', 400);
    }

    // Validación de fecha no pasada al crear
    const eventDate = new Date(date);
    if (isNaN(eventDate.getTime())) {
      throw new CustomError('La fecha proporcionada es inválida', 400);
    }
    const now = new Date();
    if (eventDate < now) {
      throw new CustomError('No se permite crear eventos con fecha pasada', 400);
    }

    // Validación de capacidad > 0
    const parsedCapacity = Number(capacity);
    if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
      throw new CustomError('La capacidad debe ser un número mayor a 0', 400);
    }

    // Validación de precio >= 0
    const parsedPrice = price !== undefined && price !== null ? Number(price) : 0;
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      throw new CustomError('El precio debe ser un número mayor o igual a 0', 400);
    }

    // Validación de status permitido
    const allowedStatuses = ['draft', 'published', 'cancelled', 'finished'];
    if (status && !allowedStatuses.includes(status)) {
      throw new CustomError(`Estado inválido. Valores permitidos: ${allowedStatuses.join(', ')}`, 400);
    }

    // El organizador SIEMPRE se asigna desde req.user (organizerId), ignorando cualquier valor del body
    const newEvent = await this.repository.createEvent({
      title: title.trim(),
      description: description.trim(),
      category: finalCategory.trim(),
      date: eventDate,
      location: location.trim(),
      capacity: parsedCapacity,
      price: parsedPrice,
      status: status || 'published',
      organizer: organizerId
    });

    return newEvent;
  }

  /**
   * Modifica un evento validando propiedad y estado no cancelado
   */
  async updateEvent(eventId, updateData, user) {
    const event = await this.repository.getEventById(eventId);
    if (!event) {
      throw new CustomError('Evento deportivo no encontrado', 404);
    }

    // Validación de pertenencia: organizer solo modifica sus eventos, admin cualquiera
    const organizerId = event.organizer?._id ? event.organizer._id.toString() : event.organizer?.toString();
    if (user.role !== 'admin' && organizerId !== user.id) {
      throw new CustomError('No tenés permisos para modificar este evento', 403);
    }

    // Regla: Eventos cancelados no pueden modificarse
    if (event.status === 'cancelled') {
      throw new CustomError('No se pueden modificar eventos cancelados', 400);
    }

    // Validar capacidad si viene en el payload
    if (updateData.capacity !== undefined) {
      const cap = Number(updateData.capacity);
      if (isNaN(cap) || cap <= 0) {
        throw new CustomError('La capacidad debe ser mayor a 0', 400);
      }
      updateData.capacity = cap;
    }

    // Validar precio si viene en el payload
    if (updateData.price !== undefined) {
      const prc = Number(updateData.price);
      if (isNaN(prc) || prc < 0) {
        throw new CustomError('El precio no puede ser negativo', 400);
      }
      updateData.price = prc;
    }

    // Validar fecha si se actualiza
    if (updateData.date !== undefined) {
      const newDate = new Date(updateData.date);
      if (isNaN(newDate.getTime())) {
        throw new CustomError('La fecha proporcionada es inválida', 400);
      }
      if (newDate < new Date()) {
        throw new CustomError('No se permite establecer una fecha pasada', 400);
      }
      updateData.date = newDate;
    }

    // Normalizar category si viene como sport_category
    if (updateData.sport_category && !updateData.category) {
      updateData.category = updateData.sport_category;
    }
    delete updateData.sport_category;

    // Proteger campo organizer de sobreescritura
    delete updateData.organizer;

    const updatedEvent = await this.repository.updateEvent(eventId, updateData);
    return updatedEvent;
  }

  /**
   * Modifica el estado de un evento (PATCH /api/events/:id/status)
   */
  async changeEventStatus(eventId, newStatus, user) {
    if (!newStatus) {
      throw new CustomError('El campo status es obligatorio', 400);
    }

    const allowedStatuses = ['draft', 'published', 'cancelled', 'finished'];
    if (!allowedStatuses.includes(newStatus)) {
      throw new CustomError(`Estado inválido. Valores permitidos: ${allowedStatuses.join(', ')}`, 400);
    }

    const event = await this.repository.getEventById(eventId);
    if (!event) {
      throw new CustomError('Evento deportivo no encontrado', 404);
    }

    // Validación de pertenencia
    const organizerId = event.organizer?._id ? event.organizer._id.toString() : event.organizer?.toString();
    if (user.role !== 'admin' && organizerId !== user.id) {
      throw new CustomError('No tenés permisos para cambiar el estado de este evento', 403);
    }

    // Regla: Si el evento ya está cancelado, no se puede cambiar su estado
    if (event.status === 'cancelled') {
      throw new CustomError('No se puede cambiar el estado de un evento que ya está cancelado', 400);
    }

    // Regla: No permitir publicar eventos ya finalizados o cancelados
    if (newStatus === 'published' && (event.status === 'finished' || event.status === 'cancelled')) {
      throw new CustomError('No se puede publicar un evento que ya está finalizado o cancelado', 400);
    }

    const updatedEvent = await this.repository.updateEvent(eventId, { status: newStatus });
    return updatedEvent;
  }

  /**
   * Cancelación lógica de evento (soft-delete)
   */
  async deleteEvent(eventId, user) {
    const event = await this.repository.getEventById(eventId);
    if (!event) {
      throw new CustomError('Evento deportivo no encontrado', 404);
    }

    const organizerId = event.organizer?._id ? event.organizer._id.toString() : event.organizer?.toString();
    if (user.role !== 'admin' && organizerId !== user.id) {
      throw new CustomError('No tenés permisos para eliminar este evento', 403);
    }

    if (event.status === 'cancelled') {
      return event;
    }

    return await this.repository.softDeleteEvent(eventId);
  }
}

export default new EventsService();
