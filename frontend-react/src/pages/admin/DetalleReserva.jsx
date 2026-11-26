import { useEffect, useState } from 'react'
import { Button, Card, Col, Row } from 'react-bootstrap'
import { Link, useParams } from 'react-router-dom'
import { mensajeDeError } from '../../api/cliente'
import { obtenerPropiedad } from '../../api/propiedades'
import { obtenerDetalleReserva } from '../../api/reservas'
import EstadoCarga from '../../components/EstadoCarga'
import EtiquetaEstado from '../../components/EtiquetaEstado'
import { calcularNoches, formatearFecha, formatearPrecio } from '../../utils/formato'

// Detalle de una reserva: MS-Reservas la entrega junto con los datos del inquilino
// y de la temporada; el nombre de la propiedad se pide a MS-Propiedades.
function DetalleReserva() {
  const { id } = useParams()
  const [carga, setCarga] = useState({ id: null, reserva: null, propiedad: null, error: '' })

  useEffect(() => {
    let vigente = true
    obtenerDetalleReserva(id)
      .then(async (reserva) => {
        const propiedad = await obtenerPropiedad(reserva.idPropiedad)
        if (vigente) setCarga({ id, reserva, propiedad, error: '' })
      })
      .catch((error) => {
        if (vigente) setCarga({ id, reserva: null, propiedad: null, error: mensajeDeError(error, 'No se encontró la reserva.') })
      })
    return () => {
      vigente = false
    }
  }, [id])

  const { reserva, propiedad } = carga

  return (
    <section>
      <h1 className="titulo">Reserva N° {id}</h1>

      <EstadoCarga cargando={carga.id !== id} error={carga.error}>
        {reserva && (
          <Row className="g-3">
            <Col lg={6}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title as="h2" className="fs-5 fw-bold">Estadía</Card.Title>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2"><strong>Estado:</strong> <EtiquetaEstado estado={reserva.estado} /></li>
                    <li className="mb-2"><strong>Propiedad:</strong> {propiedad?.nombre || `Propiedad ${reserva.idPropiedad}`}</li>
                    <li className="mb-2"><strong>Ubicación:</strong> {reserva.ubicacion || propiedad?.ubicacion}</li>
                    <li className="mb-2">
                      <strong>Fechas:</strong> {formatearFecha(reserva.llegada)} al {formatearFecha(reserva.salida)}
                      {' '}({calcularNoches(reserva.llegada, reserva.salida)} noches)
                    </li>
                    <li><strong>Reservada el:</strong> {formatearFecha(reserva.fechaReserva)}</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            <Col lg={6}>
              <Card className="h-100">
                <Card.Body>
                  <Card.Title as="h2" className="fs-5 fw-bold">Inquilino y pago</Card.Title>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2"><strong>Inquilino:</strong> {reserva.inquilino.nombre || `N° ${reserva.idInquilino}`}</li>
                    <li className="mb-2"><strong>Correo:</strong> {reserva.inquilino.correo || '—'}</li>
                    {reserva.temporada && (
                      <li className="mb-2"><strong>Temporada:</strong> {reserva.temporada} (×{reserva.multiplicador})</li>
                    )}
                    <li className="mb-2"><strong>Total:</strong> {formatearPrecio(reserva.montoTotal)}</li>
                    <li><strong>Plazo para pagar:</strong> {formatearFecha(reserva.fechaLimitePago)}</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </EstadoCarga>

      <Button as={Link} to="/admin/reservas" variant="outline-dark" className="mt-3">Volver a reservas</Button>
    </section>
  )
}

export default DetalleReserva
