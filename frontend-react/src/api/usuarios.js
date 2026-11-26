// Mantenedor de usuarios del panel: llamadas a MS-Usuarios (solo el administrador).
import cliente from './cliente'
import { convertirUsuario } from './sesion'

// Tipo que muestra el formulario → rol del backend
const ROL_POR_TIPO = {
  Administrador: 'ADMIN',
  'Anfitrión': 'ANFITRION',
  Inquilino: 'INQUILINO',
}

function haciaBackend(datos) {
  return {
    run: datos.run,
    nombre: datos.nombre,
    apellidos: datos.apellidos,
    correo: datos.correo,
    clave: datos.clave || null, // al editar, vacía = mantener la contraseña actual
    rol: ROL_POR_TIPO[datos.tipo],
    fechaNacimiento: datos.nacimiento || null,
    region: datos.region || null,
    comuna: datos.comuna || null,
    direccion: datos.direccion || null,
  }
}

// GET /api/v1/usuarios
export async function listarUsuarios() {
  const respuesta = await cliente.get('/api/v1/usuarios')
  return respuesta.data.map(convertirUsuario)
}

// GET /api/v1/usuarios/{id} → el usuario, o null si no existe
export async function obtenerUsuario(id) {
  try {
    const respuesta = await cliente.get(`/api/v1/usuarios/${id}`)
    return convertirUsuario(respuesta.data)
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 400) return null
    throw error
  }
}

// POST /api/v1/usuarios (si es inquilino, MS-Usuarios también crea su perfil en MS-Inquilinos)
export async function crearUsuario(datos) {
  const respuesta = await cliente.post('/api/v1/usuarios', haciaBackend(datos))
  return convertirUsuario(respuesta.data)
}

// PUT /api/v1/usuarios/{id}
export async function actualizarUsuario(id, datos) {
  const respuesta = await cliente.put(`/api/v1/usuarios/${id}`, haciaBackend(datos))
  return convertirUsuario(respuesta.data)
}

// DELETE /api/v1/usuarios/{id}
export async function eliminarUsuario(id) {
  await cliente.delete(`/api/v1/usuarios/${id}`)
}
