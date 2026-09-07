import EventModel from '../models/Event.js';

export class EventsDao {
  /**
   * Obtiene eventos con filtros, ordenamiento y paginación
   */
  async getPaginated({ filter = {}, page = 1, limit = 10, sort = { date: 1 } }) {
    const numericPage = Math.max(1, Number(page) || 1);
    const numericLimit = Math.max(1, Number(limit) || 10);
    const skip = (numericPage - 1) * numericLimit;

    const [total, rawEvents] = await Promise.all([
      EventModel.countDocuments(filter),
      EventModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(numericLimit)
        .populate('organizer', 'first_name last_name email')
        .lean()
    ]);

    const data = rawEvents.map(event => {
      if (event._id) {
        event.id = event._id.toString();
        delete event._id;
        delete event.__v;
      }
      return event;
    });

    const totalPages = Math.ceil(total / numericLimit) || 1;

    return {
      data,
      page: numericPage,
      limit: numericLimit,
      total,
      totalPages
    };
  }

  async getAll(filter = {}) {
    return await EventModel.find(filter).populate('organizer', 'first_name last_name email').lean();
  }

  async getById(id) {
    const event = await EventModel.findById(id).populate('organizer', 'first_name last_name email').lean();
    if (event && event._id) {
      event.id = event._id.toString();
      delete event._id;
      delete event.__v;
    }
    return event;
  }

  async create(eventData) {
    return await EventModel.create(eventData);
  }

  async update(id, eventData) {
    const updated = await EventModel.findByIdAndUpdate(id, eventData, {
      new: true,
      runValidators: true
    }).populate('organizer', 'first_name last_name email').lean();

    if (updated && updated._id) {
      updated.id = updated._id.toString();
      delete updated._id;
      delete updated.__v;
    }
    return updated;
  }

  async softDelete(id) {
    return await this.update(id, { status: 'cancelled' });
  }

  async delete(id) {
    // Para respetar la regla de no eliminación física, delega en softDelete
    return await this.softDelete(id);
  }
}

export default new EventsDao();
