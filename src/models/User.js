import mongoose from 'mongoose';

const userCollection = 'users';

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
      trim: true
    },
    last_name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'organizer', 'admin'],
      default: 'user'
    },
    sport_preference: {
      type: String,
      default: 'General'
    }
  },
  {
    timestamps: true
  }
);

const UserModel = mongoose.model(userCollection, userSchema);

export default UserModel;
