// Propiedades: llamadas a MS-Propiedades (y a MS-Precios al crear una) a través del Gateway.
// Ver el catálogo es público; crear, editar y eliminar es solo para el administrador.
import cliente from './cliente'

// El backend guarda el tipo en minúsculas y sin ñ; las páginas lo muestran con mayúscula
const TIPO_TEXTO = {
  departamento: 'Departamento',
  casa: 'Casa',
  cabana: 'Cabaña',
  loft: 'Loft',
  parcela: 'Parcela',
}
const TIPO_CODIGO = Object.fromEntries(Object.entries(TIPO_TEXTO).map(([codigo, texto]) => [texto, codigo]))

// Reglas de precio que se crean junto con cada propiedad nueva (las mismas que carga MS-Precios
// al arrancar). Sin ellas no se puede calcular el precio ni reservar la propiedad.
const TEMPORADAS = [
  { temporada: 'Alta', multiplicador: 1.5, fechaEntrada: '2026-12-01', fechaSalida: '2027-02-28' },
  { temporada: 'Media', multiplicador: 1.0, fechaEntrada: '2027-03-01', fechaSalida: '2027-05-31' },
  { temporada: 'Baja', multiplicador: 0.8, fechaEntrada: '2027-06-01', fechaSalida: '2027-08-31' },
]

// Respuesta de MS-Propiedades → formato que usan las páginas (titulo → nombre, cabana → Cabaña...)
export function desdeBackend(dto) {
  return {
    id: dto.id,
    nombre: dto.titulo,
    tipo: TIPO_TEXTO[dto.tipo] || dto.tipo,
    ubicacion: dto.ubicacion,
    precio: Number(dto.precio),
    imagen: dto.imagen || '/img/img-tarjeta-1.avif',
    alt: dto.titulo,
    descripcion: dto.descripcion,
    capacidad: dto.capacidad ?? 1,
    habitaciones: dto.habitaciones ?? 0,
    banos: dto.banos ?? 0,
    superficie: dto.superficie ?? 0,
    servicios: dto.servicios || [],
    destacada: Boolean(dto.destacada),
    disponible: dto.disponible !== false,
    idAnfitrion: dto.idAnfitrion,
  }
}

// Datos del formulario → cuerpo que espera MS-Propiedades
function haciaBackend(propiedad) {
  return {
    titulo: propiedad.nombre,
    descripcion: propiedad.descripcion,
    ubicacion: propiedad.ubicacion,
    precio: propiedad.precio,
    idAnfitrion: propiedad.idAnfitrion,
    tipo: TIPO_CODIGO[propiedad.tipo],
    imagen: propiedad.imagen,
    capacidad: propiedad.capacidad,
    habitaciones: propiedad.habitaciones,
    banos: propiedad.banos,
    superficie: propiedad.superficie,
    servicios: propiedad.servicios,
    destacada: propiedad.destacada,
  }
}

// GET /api/v1/propiedades
export async function listarPropiedades() {
  const respuesta = await cliente.get('/api/v1/propiedades')
  return respuesta.data.map(desdeBackend)
}

// GET /api/v1/propiedades/{id} → la propiedad, o null si no existe
export async function obtenerPropiedad(id) {
  try {
    const respuesta = await cliente.get(`/api/v1/propiedades/${id}`)
    return desdeBackend(respuesta.data)
  } catch (error) {
    if (error.response?.status === 404 || error.response?.status === 400) return null
    throw error
  }
}

// POST /api/v1/propiedades, luego sus 3 reglas de precio en POST /api/v1/precios.
// MS-Propiedades crea todas las propiedades como "no disponibles": al final se activa.
export async function crearPropiedad(propiedad) {
  const respuesta = await cliente.post('/api/v1/propiedades', haciaBackend(propiedad))
  const creada = desdeBackend(respuesta.data)
  for (const regla of TEMPORADAS) {
    await cliente.post('/api/v1/precios', { ...regla, idPropiedad: creada.id })
  }
  return creada.disponible ? creada : cambiarDisponibilidad(creada.id)
}

// PUT /api/v1/propiedades/{id}/estado: si estaba disponible pasa a no disponible, y al revés
export async function cambiarDisponibilidad(id) {
  const respuesta = await cliente.put(`/api/v1/propiedades/${id}/estado`)
  return desdeBackend(respuesta.data)
}

// PUT /api/v1/propiedades/{id}
export async function actualizarPropiedad(id, propiedad) {
  const respuesta = await cliente.put(`/api/v1/propiedades/${id}`, haciaBackend(propiedad))
  return desdeBackend(respuesta.data)
}

// DELETE /api/v1/propiedades/{id}
export async function eliminarPropiedad(id) {
  await cliente.delete(`/api/v1/propiedades/${id}`)
}
