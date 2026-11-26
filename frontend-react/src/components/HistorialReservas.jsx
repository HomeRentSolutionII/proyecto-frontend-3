import { useEffect, useState } from 'react'
import { Alert, Table } from 'react-bootstrap'
import { mensajeDeError } from '../api/cliente'
import { listarPropiedades } from '../api/propiedades'
import { listarReservas } from '../api/reservas'
import { calcularNoches, formatearFecha, formatearPrecio } from '../utils/formato'
import EstadoCarga from './EstadoCarga'
import EtiquetaEstado from './EtiquetaEstado'

// Reservas que el inquilino ya confirmó, guardadas en MS-Reservas.
// El Gateway le entrega a MS-Reservas el correo del token, así cada inquilino recibe solo las suyas.
// Se vuelve a cargar cada vez que cambia la prop "actualizacion" (al confirmar reservas nuevas).
function HistorialReservas({ actualizacion }) {
  const [datos, setDatos] = useState({ cargando: true, error: '', reservas: [], propiedades: {} })

  useEffect(() => {
    Promise.all([listarReservas(), listarPropiedades()])
      .then(([reservas, propiedades]) => {
        const porId = Object.fromEntries(propiedades.map((propiedad) => [propiedad.id, propiedad]))
        setDatos({ cargando: false, error: '', reservas, propiedades: porId })
      })
      .catch((error) => {
        setDatos({ cargando: false, error: mensajeDeError(error), reservas: [], propiedades: {} })
      })
  }, [actualizacion])

  return (
    <EstadoCarga cargando={datos.cargando} error={datos.error}>
      {datos.reservas.length === 0 ? (
        <Alert variant="light" className="border">Todavía no tienes reservas realizadas.</Alert>
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
            </tr>
          </thead>
          <tbody>
            {datos.reservas.map((reserva) => (
              <tr key={reserva.id}>
                <td>{reserva.id}</td>
                <td>{datos.propiedades[reserva.idPropiedad]?.nombre || `Propiedad ${reserva.idPropiedad}`}</td>
                <td className="small text-nowrap">
                  {formatearFecha(reserva.llegada)}<br />al {formatearFecha(reserva.salida)}
                </td>
                <td className="text-center">{calcularNoches(reserva.llegada, reserva.salida)}</td>
                <td className="text-end fw-bold">{formatearPrecio(reserva.montoTotal)}</td>
                <td className="text-center"><EtiquetaEstado estado={reserva.estado} /></td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </EstadoCarga>
  )
}

export default HistorialReservas
