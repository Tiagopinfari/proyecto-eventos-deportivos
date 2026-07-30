/**
 * Controladores para el recurso de Eventos Deportivos
 */

export const getEvents = async (req, res) => {
  try {
    // Por el momento en Pre-entrega 1 devuelve lista vacía
    return res.status(200).json({
      status: 'success',
      payload: []
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Error al obtener la lista de eventos deportivos: ' + error.message
    });
  }
};
