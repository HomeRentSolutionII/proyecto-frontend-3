// Qué puede hacer cada rol en el frontend. Sirve para mostrar u ocultar pantallas y botones;
// la protección real la hace el backend (el Gateway revisa el rol del token en cada petición).
//   ADMIN      → todo
//   ANFITRION  → solo ver propiedades y reservas (el "vendedor" de la pauta)
//   INQUILINO  → la tienda: buscar, reservar y ver sus reservas (el "cliente" de la pauta)

export function tieneRol(usuario, ...roles) {
  return Boolean(usuario) && roles.includes(usuario.rol)
}

export function esAdmin(usuario) {
  return tieneRol(usuario, 'ADMIN')
}

// Al panel entran el administrador y el anfitrión
export function puedeVerPanel(usuario) {
  return tieneRol(usuario, 'ADMIN', 'ANFITRION')
}

// Reservar: los inquilinos, y los visitantes (que deben iniciar sesión para confirmar)
export function puedeReservar(usuario) {
  return !usuario || usuario.rol === 'INQUILINO'
}
