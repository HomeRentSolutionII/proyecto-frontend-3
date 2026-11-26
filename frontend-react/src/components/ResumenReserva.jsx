import { formatearPrecio } from '../utils/formato'

// Desglose del precio: subtotal (precio × noches), ajuste por temporada y total.
// Los montos los calcula MS-Precios; se usa en el detalle de la propiedad y en Mis reservas.
function ResumenReserva({ etiqueta, subtotal, total, temporada, multiplicador }) {
  const ajuste = total - subtotal
  const textoAjuste = temporada ? `Temporada ${temporada} (×${multiplicador})` : 'Ajuste por temporada'

  return (
    <div className="resumen my-3">
      <p className="d-flex justify-content-between mb-1">
        <span>{etiqueta}</span> <span>{formatearPrecio(subtotal)}</span>
      </p>
      <p className="d-flex justify-content-between mb-1">
        <span>{textoAjuste}</span>
        <span>{ajuste < 0 ? '−' : '+'}{formatearPrecio(Math.abs(ajuste))}</span>
      </p>
      <p className="d-flex justify-content-between fw-bold border-top pt-2 mb-0">
        <span>Total</span> <span>{formatearPrecio(total)}</span>
      </p>
    </div>
  )
}

export default ResumenReserva
