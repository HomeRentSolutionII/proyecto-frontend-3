// Reservas: llamadas a MS-Reservas a través del Gateway.
// Un inquilino crea reservas y ve solo las suyas (el Gateway le pasa su correo a MS-Reservas);
// el anfitrión y el administrador ven todas.
import cliente from './cliente'

// Texto y color (variante de Bootstrap) de cada estado
export const ESTADOS_RESERVA = {
  PENDIENTE: { texto: 'Pendiente', color: 'warning' },
  CONFIRMADA: { texto: 'Confirmada', color: 'success' },
  CANCELADA: { texto: 'Cancelada', color: 'secondary' },
  FINALIZADA: { texto: 'Finalizada', color: 'dark' },
}

// "2026-12-20T00:00:00" → "2026-12-20"
function soloFecha(fechaHora) {
  return fechaHora ? fechaHora.slice(0, 10) : ''
}

function desdeBackend(dto) {
  return {
    id: dto.idReserva,
    idPropiedad: dto.idPropiedad,
    idInquilino: dto.idInquilino,
    estado: dto.estadoReserva || dto.estado,
    llegada: soloFecha(dto.fechaInicio),
    salida: soloFecha(dto.fechaFin),
    fechaReserva: soloFecha(dto.fechaReserva),
    montoTotal: Math.round(Number(dto.montoTotal) || 0),
  }
}

// POST /api/v1/reservas. Para un inquilino, MS-Reservas usa siempre su propio idInquilino.
export async function crearReserva({ propiedadId, llegada, salida }) {
  const respuesta = await cliente.post('/api/v1/reservas', {
    idPropiedad: propiedadId,
    fechaInicio: llegada,
    fechaFin: salida,
  })
  return desdeBackend(respuesta.data)
}

// GET /api/v1/reservas, de la más nueva a la más antigua
export async function listarReservas() {
  const respuesta = await cliente.get('/api/v1/reservas')
  return respuesta.data.map(desdeBackend).sort((a, b) => b.id - a.id)
}

// GET /api/v1/reservas/{id}/admin → la reserva con los datos del inquilino y de la temporada
export async function obtenerDetalleReserva(id) {
  const respuesta = await cliente.get(`/api/v1/reservas/${id}/admin`)
  const dto = respuesta.data
  return {
    ...desdeBackend(dto),
    fechaLimitePago: soloFecha(dto.fechaLimitesPago),
    ubicacion: dto.ubicacion,
    precioBase: dto.precioBase != null ? Number(dto.precioBase) : null,
    temporada: dto.temporada,
    multiplicador: dto.multiplicador,
    inquilino: { nombre: dto.nombre, correo: dto.email },
  }
}
