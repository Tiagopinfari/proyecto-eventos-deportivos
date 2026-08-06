import bcrypt from 'bcryptjs';

/**
 * Genera un hash seguro para la contraseña del usuario utilizando bcrypt
 * @param {string} password - Contraseña en texto plano
 * @returns {string} Hash de la contraseña
 */
export const createHash = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

/**
 * Compara una contraseña en texto plano con un hash almacenado
 * @param {string} password - Contraseña enviada en texto plano
 * @param {string} hashedPassword - Hash almacenado en la base de datos
 * @returns {boolean} true si coinciden, false si no
 */
export const isValidPassword = (password, hashedPassword) => {
  return bcrypt.compareSync(password, hashedPassword);
};
