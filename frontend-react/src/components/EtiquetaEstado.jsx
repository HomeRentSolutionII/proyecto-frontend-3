import { Badge } from 'react-bootstrap'
import { ESTADOS_RESERVA } from '../api/reservas'

// Estado de una reserva (Pendiente, Confirmada...) con su color
function EtiquetaEstado({ estado }) {
  const datos = ESTADOS_RESERVA[estado] || { texto: estado, color: 'secondary' }
  return (
    <Badge bg={datos.color} text={datos.color === 'warning' ? 'dark' : undefined}>
      {datos.texto}
    </Badge>
  )
}

export default EtiquetaEstado
