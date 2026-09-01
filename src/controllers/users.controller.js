import usersRepository from '../repositories/users.repository.js';
import { successResponse } from '../utils/response-handler.js';

/**
 * Controlador para la ruta administrativa de usuarios (solo admin)
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await usersRepository.getUsers();
    // Sanitización para asegurar que no se devuelvan contraseñas
    const sanitizedUsers = users.map((user) => ({
      id: user._id ? user._id.toString() : user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      sport_preference: user.sport_preference || 'General'
    }));

    return successResponse(res, sanitizedUsers, 'Usuarios obtenidos con éxito');
  } catch (error) {
    next(error);
  }
};
