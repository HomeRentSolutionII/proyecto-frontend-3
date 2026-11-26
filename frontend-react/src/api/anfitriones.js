// Anfitriones registrados en MS-Anfitriones (solo el administrador).
// El formulario de propiedades los usa para elegir a quién pertenece cada propiedad.
import cliente from './cliente'

// GET /api/v1/anfitriones → [{ id, nombre, correo }]
export async function listarAnfitriones() {
  const respuesta = await cliente.get('/api/v1/anfitriones')
  return respuesta.data.map((dto) => ({ id: dto.idAnfitrion, nombre: dto.nombre, correo: dto.email }))
}
