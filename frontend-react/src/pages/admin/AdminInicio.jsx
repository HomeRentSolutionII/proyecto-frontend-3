import { Alert, Card, Col, Row, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { listarMensajes } from '../../data/mensajes'
import { listarPropiedades } from '../../data/propiedades'
import { obtenerReservas } from '../../data/reservas'
import { listarUsuarios } from '../../data/usuarios'
import { formatearFecha } from '../../utils/formato'
import { MOTIVOS } from '../../utils/validacionesContacto'

function textoMotivo(valor) {
  const motivo = MOTIVOS.find((opcion) => opcion.valor === valor)
  return motivo ? motivo.texto : valor
}

function AdminInicio() {
  const mensajes = listarMensajes()
  const ultimosMensajes = [...mensajes].reverse().slice(0, 5)

  // Las cifras se calculan con los datos reales de la aplicación
  const cifras = [
    { titulo: 'Propiedades publicadas', valor: listarPropiedades().length, ruta: '/admin/propiedades' },
    { titulo: 'Usuarios registrados', valor: listarUsuarios().length, ruta: '/admin/usuarios' },
    { titulo: 'Reservas en curso', valor: obtenerReservas().length },
    { titulo: 'Mensajes de contacto', valor: mensajes.length },
  ]

  return (
    <section>
      <h1 className="titulo">Home Admin</h1>
      <p className="text-muted">Resumen de la plataforma.</p>

      <Row xs={1} sm={2} xl={4} className="g-3 mb-4">
        {cifras.map((cifra) => (
          <Col key={cifra.titulo}>
            <Card className="dato-admin h-100">
              <Card.Body>
                <p className="cifra">{cifra.valor}</p>
                <p className="small text-muted mb-1">{cifra.titulo}</p>
                {cifra.ruta && <Link className="small" to={cifra.ruta}>Ver detalle</Link>}
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
    </section>
  )
}

export default AdminInicio
