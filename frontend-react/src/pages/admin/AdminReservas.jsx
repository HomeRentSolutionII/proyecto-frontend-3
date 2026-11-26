import { useEffect, useState } from 'react'
import { Alert, Button, Form, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { mensajeDeError } from '../../api/cliente'
import { listarPropiedades } from '../../api/propiedades'
import { ESTADOS_RESERVA, listarReservas } from '../../api/reservas'
import EstadoCarga from '../../components/EstadoCarga'
import EtiquetaEstado from '../../components/EtiquetaEstado'
import { calcularNoches, formatearFecha, formatearPrecio } from '../../utils/formato'

// Listado de todas las reservas de MS-Reservas (las "órdenes" de la pauta).
// Lo ven el administrador y el anfitrión; desde aquí se abre el detalle de cada una.
function AdminReservas() {
  const [datos, setDatos] = useState({ cargando: true, error: '', reservas: [], propiedades: {} })
  const [estado, setEstado] = useState('') // filtro por estado ('' = todas)

  useEffect(() => {
    Promise.all([listarReservas(), listarPropiedades()])
      .then(([reservas, propiedades]) => {
        const porId = Object.fromEntries(propiedades.map((propiedad) => [propiedad.id, propiedad]))
        setDatos({ cargando: false, error: '', reservas, propiedades: porId })
      })
      .catch((error) => setDatos({ cargando: false, error: mensajeDeError(error), reservas: [], propiedades: {} }))
  }, [])

  const resultado = datos.reservas.filter((reserva) => !estado || reserva.estado === estado)

  return (
    <section>
      <h1 className="titulo">Reservas</h1>
      <p className="text-muted">{resultado.length} de {datos.reservas.length} reservas.</p>

      <Form.Group className="mb-3" controlId="filtro-estado" style={{ maxWidth: '16rem' }}>
        <Form.Label>Estado</Form.Label>
        <Form.Select value={estado} onChange={(evento) => setEstado(evento.target.value)}>
          <option value="">Todas</option>
          {Object.entries(ESTADOS_RESERVA).map(([valor, { texto }]) => (
            <option key={valor} value={valor}>{texto}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <EstadoCarga cargando={datos.cargando} error={datos.error}>
        {resultado.length === 0 ? (
          <Alert variant="info">No hay reservas para mostrar.</Alert>
        ) : (
          <Table responsive hover className="align-middle">
            <thead>
              <tr>
                <th>N°</th>
                <th>Propiedad</th>
                <th>Fechas</th>
                <th className="text-center">Noches</th>
                <th className="text-end">Total</th>
                <th className="text-center">Estado</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {resultado.map((reserva) => (
                <tr key={reserva.id}>
                  <td>{reserva.id}</td>
                  <td>{datos.propiedades[reserva.idPropiedad]?.nombre || `Propiedad ${reserva.idPropiedad}`}</td>
                  <td className="small text-nowrap">
                    {formatearFecha(reserva.llegada)}<br />al {formatearFecha(reserva.salida)}
                  </td>
                  <td className="text-center">{calcularNoches(reserva.llegada, reserva.salida)}</td>
                  <td className="text-end">{formatearPrecio(reserva.montoTotal)}</td>
                  <td className="text-center"><EtiquetaEstado estado={reserva.estado} /></td>
                  <td className="text-center">
                    <Button
                      as={Link}
                      to={`/admin/reservas/${reserva.id}`}
                      variant="outline-dark"
                      size="sm"
                      aria-label={`Ver detalle de la reserva ${reserva.id}`}
                    >
                      Ver detalle
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </EstadoCarga>
    </section>
  )
}

export default AdminReservas
