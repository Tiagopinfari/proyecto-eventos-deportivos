/**
 * DTO para la entidad Usuario
 * Garantiza que la contraseña NUNCA se exponga en ninguna respuesta de la API
 */
export class UserDTO {
  constructor(user) {
    if (!user) return;
    this.id = user._id ? user._id.toString() : (user.id || null);
    this.first_name = user.first_name || '';
    this.last_name = user.last_name || '';
    this.email = user.email || '';
    this.role = user.role || 'user';
    this.sport_preference = user.sport_preference || 'General';
  }

  static from(user) {
    if (!user) return null;
    if (Array.isArray(user)) {
      return user.map(u => new UserDTO(u));
    }
    return new UserDTO(user);
  }
}

export default UserDTO;
