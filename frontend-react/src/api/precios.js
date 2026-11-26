// Precio de una estadía: MS-Precios lo calcula con la regla oficial del proyecto
// (precio por noche × multiplicador de la temporada × noches), la misma que cobra MS-Reservas.
import cliente from './cliente'

// POST /api/v1/precios/calcular (público) → { temporada, multiplicador, noches, subtotal, total }
export async function calcularPrecio(idPropiedad, llegada, salida) {
  const respuesta = await cliente.post('/api/v1/precios/calcular', {
    idPropiedad,
    fechaEntrada: llegada,
    fechaSalida: salida,
  })
  const datos = respuesta.data
  return {
    temporada: datos.temporada,
    multiplicador: datos.multiplicador,
    noches: datos.cantidadNoches,
    subtotal: Math.round(Number(datos.subtotalBase)),
    total: Math.round(Number(datos.totalFinal)),
  }
}
