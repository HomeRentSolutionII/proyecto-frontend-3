// "Carrito" de Home Rent Solution: las estadías que la persona eligió y todavía no confirma.
// Se guarda en localStorage; al confirmar, cada una se envía a MS-Reservas.
// Cada estadía guarda el precio que calculó MS-Precios (subtotal, temporada y total).

const CLAVE = 'hrs_carrito'

function guardar(lista) {
  localStorage.setItem(CLAVE, JSON.stringify(lista))
}

export function obtenerReservas() {
  const guardadas = localStorage.getItem(CLAVE)
  return guardadas ? JSON.parse(guardadas) : []
}

// Recibe los datos de la estadía y devuelve la lista actualizada
export function agregarReserva(reserva) {
  const anteriores = obtenerReservas()
  const nueva = { ...reserva, id: Math.max(0, ...anteriores.map((otra) => otra.id)) + 1 }
  const lista = [...anteriores, nueva]
  guardar(lista)
  return lista
}

// Quita una o varias estadías (por ejemplo, las que ya se confirmaron)
export function quitarReservas(ids) {
  const lista = obtenerReservas().filter((reserva) => !ids.includes(reserva.id))
  guardar(lista)
  return lista
}

export function quitarReserva(id) {
  return quitarReservas([id])
}

// Suma de todas las estadías: subtotal (precio × noches) y total con la temporada aplicada
export function calcularTotales(reservas) {
  return reservas.reduce(
    (suma, reserva) => ({ subtotal: suma.subtotal + reserva.subtotal, total: suma.total + reserva.total }),
    { subtotal: 0, total: 0 },
  )
}
