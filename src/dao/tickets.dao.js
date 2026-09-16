import mongoose from 'mongoose';
import TicketModel from '../models/Ticket.js';

export class TicketsDao {
  _formatTicket(ticket) {
    if (!ticket) return null;
    if (ticket._id) {
      ticket.id = ticket._id.toString();
      delete ticket._id;
      delete ticket.__v;
    }
    return ticket;
  }

  async create(ticketData) {
    return await TicketModel.create(ticketData);
  }

  async getById(id) {
    const ticket = await TicketModel.findById(id)
      .populate('event', 'title date location category price status organizer')
      .populate('user', 'first_name last_name email')
      .lean();
    return this._formatTicket(ticket);
  }

  async getByUser(userId) {
    const tickets = await TicketModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('event', 'title date location category price status')
      .lean();
    return tickets.map(t => this._formatTicket(t));
  }

  async getByEvent(eventId) {
    const tickets = await TicketModel.find({ event: eventId })
      .sort({ createdAt: -1 })
      .populate('user', 'first_name last_name email')
      .lean();
    return tickets.map(t => this._formatTicket(t));
  }

  async getActiveUserTicket(userId, eventId) {
    const ticket = await TicketModel.findOne({
      user: userId,
      event: eventId,
      status: { $in: ['confirmed', 'pending'] }
    }).lean();
    return this._formatTicket(ticket);
  }

  async getOccupiedCapacity(eventId) {
    const objectId = mongoose.Types.ObjectId.isValid(eventId)
      ? new mongoose.Types.ObjectId(eventId)
      : eventId;

    const result = await TicketModel.aggregate([
      {
        $match: {
          event: objectId,
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalOccupied: { $sum: '$quantity' }
        }
      }
    ]);

    return result.length > 0 ? result[0].totalOccupied : 0;
  }

  async update(id, updateData) {
    const updated = await TicketModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    })
      .populate('event', 'title date location category price')
      .lean();
    return this._formatTicket(updated);
  }

  async cancel(id) {
    return await this.update(id, {
      status: 'cancelled',
      cancelledAt: new Date()
    });
  }
}

export default new TicketsDao();
