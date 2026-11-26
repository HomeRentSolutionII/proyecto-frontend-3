// Datos fijos sobre usuarios. Las cuentas y la sesión están en el backend
// (src/api/usuarios.js, src/api/auth.js y src/api/sesion.js).

// Administrador de prueba que crea MS-Usuarios al arrancar (para el botón del login)
export const ADMIN_PRUEBA = {
  correo: 'admin@duoc.cl',
  clave: 'admin123',
}

// Tipos de cuenta, como se muestran en las páginas (en el backend: ADMIN, ANFITRION, INQUILINO)
export const TIPOS_USUARIO = ['Administrador', 'Anfitrión', 'Inquilino']
