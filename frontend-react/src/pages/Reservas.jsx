import { useState } from 'react'
import { Alert, Button, Card, Col, Container, Row, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { mensajeDeError } from '../api/cliente'
import { crearReserva } from '../api/reservas'
import HistorialReservas from '../components/HistorialReservas'
import ResumenReserva from '../components/ResumenReserva'
import { calcularTotales } from '../data/reservas'
import { formatearFecha, formatearPrecio } from '../utils/formato'

// Mis reservas: arriba, las estadías elegidas que falta confirmar (el "carrito");
// abajo, las reservas que el inquilino ya hizo, leídas desde MS-Reservas.
function Reservas({ reservas, usuario, onQuitar, onConfirmar }) {
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState(null) // { confirmadas, errores } del último envío
  const [actualizacion, setActualizacion] = useState(0) // al cambiar, el historial se recarga

  // Envía cada estadía a MS-Reservas. Las que se crean salen del carrito; las que fallan se quedan.
  async function confirmar() {
    setEnviando(true)
    setResultado(null)
    const confirmadas = []
    const errores = []
    for (const reserva of reservas) {
      try {
        await crearReserva(reserva)
        confirmadas.push(reserva.id)
      } catch (error) {
        errores.push(`${reserva.nombre}: ${mensajeDeError(error, 'no se pudo reservar.')}`)
      }
    }
    onConfirmar(confirmadas)
    setResultado({ confirmadas: confirmadas.length, errores })
    setEnviando(false)
    setActualizacion((anterior) => anterior + 1)
  }

  const { subtotal, total } = calcularTotales(reservas)

  return (
    <Container as="section" className="py-5">
      <h1 className="titulo">Mis reservas</h1>

      {resultado?.confirmadas > 0 && (
        <Alert variant="success">
          ¡Listo! Registramos {resultado.confirmadas === 1 ? 'tu reserva' : `tus ${resultado.confirmadas} reservas`} en
          estado Pendiente, hasta que se confirme el pago. Puedes revisarlas más abajo, en Reservas realizadas.
        </Alert>
      )}
      {resultado?.errores.length > 0 && (
        <Alert variant="danger">
          No se pudieron registrar:
          <ul className="mb-0">
            {resultado.errores.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </Alert>
      )}

      {reservas.length === 0 ? (
        <>
          <Alert variant="info">No tienes estadías por confirmar.</Alert>
          <Button as={Link} to="/propiedades" variant="primary">Ver propiedades</Button>
        </>
      ) : (
        <>
          <p className="text-muted">Revisa las propiedades y fechas que seleccionaste antes de confirmar.</p>
          <Row className="g-4">
            {/* ===== LISTADO DE LO SELECCIONADO ===== */}
            <Col lg={8}>
              <Table responsive hover className="align-middle">
                <thead>
                  <tr>
                    <th>Propiedad</th>
                    <th>Fechas</th>
                    <th className="text-center">Noches</th>
                    <th className="text-end">Total</th>
                    <th className="text-center">Quitar</th>
                  </tr>
                </thead>
                <tbody>
                  {reservas.map((reserva) => (
                    <tr key={reserva.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <img className="miniatura" src={reserva.imagen} alt="" />
                          <div>
                            <strong>{reserva.nombre}</strong>
                            <div className="small text-muted">{reserva.ubicacion}</div>
                          </div>
                        </div>
                      </td>
                      <td className="small text-nowrap">
                        {formatearFecha(reserva.llegada)}<br />al {formatearFecha(reserva.salida)}
                      </td>
                      <td className="text-center">{reserva.noches}</td>
                      <td className="text-end">
                        <strong>{formatearPrecio(reserva.total)}</strong>
                        <div className="small text-muted">Temporada {reserva.temporada}</div>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          aria-label={`Quitar ${reserva.nombre}`}
                          disabled={enviando}
                          onClick={() => onQuitar(reserva.id)}
                        >
                          &times;
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <Button as={Link} to="/propiedades" variant="outline-dark">Seguir buscando</Button>
            </Col>

            {/* ===== RESUMEN ===== */}
            <Col lg={4}>
              <Card className="panel-reserva shadow-sm">
                <Card.Body>
                  <h2 className="fs-5 fw-bold">Resumen</h2>
                  <ResumenReserva
                    etiqueta={`Subtotal (${reservas.length} ${reservas.length === 1 ? 'propiedad' : 'propiedades'})`}
                    subtotal={subtotal}
                    total={total}
                  />
                  {usuario ? (
                    <Button variant="primary" className="w-100" disabled={enviando} onClick={confirmar}>
                      {enviando ? 'Enviando...' : 'Confirmar reserva'}
                    </Button>
                  ) : (
                    <>
                      <Button as={Link} to="/login" variant="primary" className="w-100">Confirmar reserva</Button>
                      <p className="small text-muted text-center mt-2 mb-0">
                        Necesitas iniciar sesión para confirmar.
                      </p>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* ===== RESERVAS YA HECHAS (MS-Reservas) ===== */}
      {usuario && (
        <section className="mt-5">
          <h2 className="titulo fs-4">Reservas realizadas</h2>
          <HistorialReservas actualizacion={actualizacion} />
        </section>
      )}
    </Container>
  )
}

export default Reservas
