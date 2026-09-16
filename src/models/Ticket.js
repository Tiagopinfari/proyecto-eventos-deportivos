import mongoose from 'mongoose';

const ticketCollection = 'tickets';

const ticketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: [true, 'El usuario es obligatorio'],
      index: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'events',
      required: [true, 'El evento es obligatorio'],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['confirmed', 'pending', 'cancelled'],
        message: '{VALUE} no es un estado válido de ticket (confirmed, pending, cancelled)'
      },
      default: 'confirmed',
      index: true
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad de cupos es obligatoria'],
      min: [1, 'La cantidad debe ser mayor a 0'],
      default: 1
    },
    reservationCode: {
      type: String,
      required: [true, 'El código de reserva es obligatorio'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Mapeo automático de _id a id para respuestas limpias
ticketSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const TicketModel = mongoose.model(ticketCollection, ticketSchema);

export default TicketModel;
