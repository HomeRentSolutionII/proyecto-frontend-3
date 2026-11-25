// [P3-1] Archivo nuevo. No lo usa nadie hasta que descomentes los bloques [P3-1] de las páginas.
//
// Cuenta del usuario: llamadas a MS-Usuarios a través del Gateway.
import cliente from './cliente'

// POST /api/v1/auth/login → { tokenAcceso, tokenRenovacion, usuario }
export async function iniciarSesion(correo, clave) {
  const respuesta = await cliente.post('/api/v1/auth/login', {
    correo: correo.trim().toLowerCase(),
    clave,
  })
  return respuesta.data
}

// POST /api/v1/auth/registro → crea la cuenta (siempre con rol INQUILINO) y su perfil en MS-Inquilinos
export async function registrar(datos) {
  const respuesta = await cliente.post('/api/v1/auth/registro', {
    run: datos.run.trim().toUpperCase(),
    nombre: datos.nombre.trim(),
    apellidos: datos.apellidos.trim(),
    correo: datos.correo.trim().toLowerCase(),
    clave: datos.clave,
    fechaNacimiento: datos.nacimiento || null,
    region: datos.region,
    comuna: datos.comuna,
    direccion: datos.direccion.trim(),
  })
  return respuesta.data
}

// GET /api/v1/auth/me → datos del dueño del token. Sirve para revisar que la sesión guardada sigue válida.
export async function obtenerUsuarioActual() {
  const respuesta = await cliente.get('/api/v1/auth/me')
  return respuesta.data
}
