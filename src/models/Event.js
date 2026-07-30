import mongoose from 'mongoose';

const eventCollection = 'events';

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    sport_category: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    capacity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      default: 0
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'completed'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

const EventModel = mongoose.model(eventCollection, eventSchema);

export default EventModel;
