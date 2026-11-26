// Formulario de contacto: llamadas a MS-Mensajería a través del Gateway.
// Enviar un mensaje es público; verlos y eliminarlos es solo para el administrador.
import cliente from './cliente'

function desdeBackend(dto) {
  return {
    id: dto.idContacto,
    nombre: dto.nombre,
    correo: dto.correo,
    telefono: dto.telefono || '',
    motivo: dto.motivo,
    mensaje: dto.mensaje,
    fecha: dto.fecha ? dto.fecha.slice(0, 10) : '',
  }
}

// POST /api/v1/contacto
export async function enviarMensaje(datos) {
  const respuesta = await cliente.post('/api/v1/contacto', datos)
  return desdeBackend(respuesta.data)
}

// GET /api/v1/contacto, del más nuevo al más antiguo
export async function listarMensajes() {
  const respuesta = await cliente.get('/api/v1/contacto')
  return respuesta.data.map(desdeBackend).sort((a, b) => b.id - a.id)
}

// DELETE /api/v1/contacto/{id}
export async function eliminarMensaje(id) {
  await cliente.delete(`/api/v1/contacto/${id}`)
}
