// [P3-1] Archivo nuevo. No lo usa nadie hasta que descomentes los bloques [P3-1] de App.jsx.
//
// Sesión del usuario guardada en el navegador (localStorage): los dos tokens que entrega
// MS-Usuarios y los datos públicos del usuario. Así la sesión sigue abierta aunque se
// recargue la página o se cierre el navegador.

const CLAVE_SESION = 'hrs_sesion'
const CLAVE_TOKENS = 'hrs_tokens'

// Evento que lanza cliente.js cuando la sesión venció y no se pudo renovar (lo escucha App.jsx)
export const EVENTO_SESION_EXPIRADA = 'hrs:sesion-expirada'

// Cómo se muestra en las páginas cada rol del backend
const TIPO_POR_ROL = {
  ADMIN: 'Administrador',
  ANFITRION: 'Anfitrión',
  INQUILINO: 'Inquilino',
}

// Pasa un usuario de MS-Usuarios (idUsuario, rol...) al formato que ya usan las páginas (id, tipo...)
export function convertirUsuario(dto) {
  return {
    id: dto.idUsuario,
    run: dto.run,
    nombre: dto.nombre,
    apellidos: dto.apellidos,
    correo: dto.correo,
    rol: dto.rol,
    tipo: TIPO_POR_ROL[dto.rol] || dto.rol,
    nacimiento: dto.fechaNacimiento || '',
    region: dto.region || '',
    comuna: dto.comuna || '',
    direccion: dto.direccion || '',
  }
}

// ===== TOKENS =====
export function guardarTokens({ tokenAcceso, tokenRenovacion }) {
  localStorage.setItem(CLAVE_TOKENS, JSON.stringify({ tokenAcceso, tokenRenovacion }))
}

function leerTokens() {
  const tokens = localStorage.getItem(CLAVE_TOKENS)
  return tokens ? JSON.parse(tokens) : {}
}

export function obtenerTokenAcceso() {
  return leerTokens().tokenAcceso || null
}

export function obtenerTokenRenovacion() {
  return leerTokens().tokenRenovacion || null
}

// ===== SESIÓN =====
// Devuelve el usuario con sesión iniciada, o null. Sin tokens no hay sesión.
export function obtenerSesion() {
  const usuario = localStorage.getItem(CLAVE_SESION)
  return usuario && obtenerTokenRenovacion() ? JSON.parse(usuario) : null
}

// Recibe la respuesta del login ({ tokenAcceso, tokenRenovacion, usuario }) y devuelve el usuario
export function guardarSesion(respuesta) {
  guardarTokens(respuesta)
  return actualizarUsuarioSesion(respuesta.usuario)
}

// Reemplaza los datos del usuario guardado (por ejemplo, con lo que responde /auth/me)
export function actualizarUsuarioSesion(dto) {
  const usuario = convertirUsuario(dto)
  localStorage.setItem(CLAVE_SESION, JSON.stringify(usuario))
  return usuario
}

// Con JWT el servidor no guarda sesiones: cerrar sesión es borrar los tokens del navegador
export function cerrarSesion() {
  localStorage.removeItem(CLAVE_SESION)
  localStorage.removeItem(CLAVE_TOKENS)
}
