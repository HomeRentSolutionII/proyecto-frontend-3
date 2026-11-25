import { useState } from 'react'
import { Alert, Badge, Button, Form, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import ConfirmarEliminacion from '../../components/ConfirmarEliminacion'
import { eliminarPropiedad, filtrarPropiedades, listarPropiedades } from '../../data/propiedades'
import { formatearPrecio } from '../../utils/formato'

// Listado de propiedades con búsqueda, edición y eliminación
function AdminPropiedades() {
  const [propiedades, setPropiedades] = useState(() => listarPropiedades())
  const [busqueda, setBusqueda] = useState('')
  const [porEliminar, setPorEliminar] = useState(null) // propiedad esperando confirmación
  const [mensaje, setMensaje] = useState('')

  const resultado = filtrarPropiedades(propiedades, { texto: busqueda })

  function confirmarEliminacion() {
    eliminarPropiedad(porEliminar.id)
    setPropiedades(listarPropiedades())
    setMensaje(`Se eliminó "${porEliminar.nombre}".`)
    setPorEliminar(null)
  }

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 className="titulo">Propiedades</h1>
          <p className="text-muted mb-0">{resultado.length} de {propiedades.length} propiedades.</p>
        </div>
        <Button as={Link} to="/admin/propiedades/nueva" variant="primary">Nueva propiedad</Button>
      </div>

      {mensaje && <Alert variant="success">{mensaje}</Alert>}

      <Form.Group className="mb-3" controlId="buscar-propiedad">
        <Form.Label>Buscar por nombre o ubicación</Form.Label>
        <Form.Control
          type="search"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />
      </Form.Group>

      {resultado.length === 0 ? (
        <Alert variant="info">No hay propiedades que coincidan con la búsqueda.</Alert>
      ) : (
        <Table responsive hover className="align-middle">
          <thead>
            <tr>
              <th>Propiedad</th>
              <th>Tipo</th>
              <th>Ubicación</th>
              <th className="text-end">Por noche</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {resultado.map((propiedad) => (
              <tr key={propiedad.id}>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <img className="miniatura" src={propiedad.imagen} alt="" />
                    <strong>{propiedad.nombre}</strong>
                  </div>
                </td>
                <td><Badge bg="secondary">{propiedad.tipo}</Badge></td>
                <td>{propiedad.ubicacion}</td>
                <td className="text-end">{formatearPrecio(propiedad.precio)}</td>
                <td className="text-center text-nowrap">
                  <Button
                    as={Link}
                    to={`/admin/propiedades/${propiedad.id}/editar`}
                    variant="outline-dark"
                    size="sm"
                    className="me-1"
                    aria-label={`Editar ${propiedad.nombre}`}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    aria-label={`Eliminar ${propiedad.nombre}`}
                    onClick={() => setPorEliminar(propiedad)}
                  >
                    Eliminar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      <ConfirmarEliminacion
        nombre={porEliminar?.nombre}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setPorEliminar(null)}
      />
    </section>
  )
}

export default AdminPropiedades
