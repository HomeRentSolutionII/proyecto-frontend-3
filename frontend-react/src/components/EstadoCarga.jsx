import { Alert, Spinner } from 'react-bootstrap'

// Mientras llegan los datos del backend muestra "Cargando...", si fallan muestra el error
// y, cuando están listos, muestra el contenido (children).
function EstadoCarga({ cargando, error, children }) {
  if (cargando) {
    return (
      <div className="text-center text-muted py-5" role="status">
        <Spinner animation="border" size="sm" className="me-2" />
        Cargando...
      </div>
    )
  }
  if (error) {
    return <Alert variant="danger">{error}</Alert>
  }
  return children
}

export default EstadoCarga
