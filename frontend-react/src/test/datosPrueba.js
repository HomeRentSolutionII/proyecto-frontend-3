// Datos de ejemplo para las pruebas. Tienen la misma forma que devuelven los módulos de src/api,
// así las pruebas simulan el backend (con vi.mock) sin necesitar los microservicios encendidos.
import propiedadesJson from '../assets/js/propiedades.json'

// Las 20 propiedades de ejemplo, como las entrega src/api/propiedades.js
export const PROPIEDADES = propiedadesJson.map((propiedad, indice) => ({
  ...propiedad,
  disponible: true,
  idAnfitrion: (indice % 2) + 1,
}))

export const ADMIN = {
  id: 1, run: '111111111', nombre: 'Administrador', apellidos: 'Home Rent', correo: 'admin@duoc.cl',
  rol: 'ADMIN', tipo: 'Administrador',
}
export const ANFITRION = {
  id: 2, run: '123456785', nombre: 'Victor', apellidos: 'Urra', correo: 'anfitrion@duoc.cl',
  rol: 'ANFITRION', tipo: 'Anfitrión',
}
export const INQUILINO = {
  id: 3, run: '222222222', nombre: 'Pedro', apellidos: 'Gonzalez', correo: 'inquilino@duoc.cl',
  rol: 'INQUILINO', tipo: 'Inquilino', region: 'Biobío', comuna: 'Concepción', nacimiento: '2000-05-20',
}
export const USUARIOS = [ADMIN, ANFITRION, INQUILINO]

// Reservas como las entrega src/api/reservas.js
export const RESERVAS = [
  { id: 2, idPropiedad: 2, idInquilino: 1, estado: 'CONFIRMADA', llegada: '2026-12-21', salida: '2026-12-24',
    fechaReserva: '2026-11-20', montoTotal: 414000 },
  { id: 1, idPropiedad: 1, idInquilino: 1, estado: 'PENDIENTE', llegada: '2027-07-01', salida: '2027-07-03',
    fechaReserva: '2026-11-20', montoTotal: 108800 },
]

// Mensajes de contacto como los entrega src/api/contacto.js
export const MENSAJES = [
  { id: 1, nombre: 'Ana Soto', correo: 'ana@correo.cl', telefono: '', motivo: 'reserva',
    mensaje: 'Necesito ayuda con mi reserva.', fecha: '2026-11-20' },
]

export const ANFITRIONES = [
  { id: 1, nombre: 'Victor Urra', correo: 'anfitrion@duoc.cl' },
  { id: 2, nombre: 'Jenny Salamanca', correo: 'jenny.salamanca@email.com' },
]
