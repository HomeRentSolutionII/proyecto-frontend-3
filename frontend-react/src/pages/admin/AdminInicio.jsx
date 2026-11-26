import { useEffect, useState } from 'react'
import { Alert, Card, Col, Row, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { mensajeDeError } from '../../api/cliente'
import { listarMensajes } from '../../api/contacto'
import { listarPropiedades } from '../../api/propiedades'
import { listarReservas } from '../../api/reservas'
import { listarUsuarios } from '../../api/usuarios'
import EstadoCarga from '../../components/EstadoCarga'
import { formatearFecha } from '../../utils/formato'
import { textoMotivo } from '../../utils/validacionesContacto'

function AdminInicio() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')

  // Las cifras salen de cuatro microservicios; se piden todas al mismo tiempo
  useEffect(() => {
    Promise.all([listarPropiedades(), listarUsuarios(), listarReservas(), listarMensajes()])
      .then(([propiedades, usuarios, reservas, mensajes]) => setDatos({ propiedades, usuarios, reservas, mensajes }))
      .catch((errorCarga) => setError(mensajeDeError(errorCarga)))
  }, [])

  const cifras = datos && [
    { titulo: 'Propiedades publicadas', valor: datos.propiedades.length, ruta: '/admin/propiedades' },
    { titulo: 'Usuarios registrados', valor: datos.usuarios.length, ruta: '/admin/usuarios' },
    { titulo: 'Reservas', valor: datos.reservas.length, ruta: '/admin/reservas' },
    { titulo: 'Mensajes de contacto', valor: datos.mensajes.length, ruta: '/admin/mensajes' },
  ]
  const ultimosMensajes = datos ? datos.mensajes.slice(0, 5) : []

  return (
    <section>
      <h1 className="titulo">Home Admin</h1>
      <p className="text-muted">Resumen de la plataforma.</p>

      <EstadoCarga cargando={!datos && !error} error={error}>
        <Row xs={1} sm={2} xl={4} className="g-3 mb-4">
          {cifras?.map((cifra) => (
            <Col key={cifra.titulo}>
              <Card className="dato-admin h-100">
                <Card.Body>
                  <p className="cifra">{cifra.valor}</p>
                  <p className="small text-muted mb-1">{cifra.titulo}</p>
                  <Link className="small" to={cifra.ruta}>Ver detalle</Link>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        <h2 className="fs-5 fw-bold">Últimos mensajes de contacto</h2>
        {ultimosMensajes.length === 0 ? (
          <Alert variant="info">Todavía no hay mensajes de contacto.</Alert>
        ) : (
          <Table responsive hover className="align-middle">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {ultimosMensajes.map((mensaje) => (
                <tr key={mensaje.id}>
                  <td className="text-nowrap">{formatearFecha(mensaje.fecha)}</td>
                  <td>{mensaje.nombre}</td>
                  <td>{mensaje.correo}</td>
                  <td>{textoMotivo(mensaje.motivo)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </EstadoCarga>
    </section>
  )
}

export default AdminInicio
