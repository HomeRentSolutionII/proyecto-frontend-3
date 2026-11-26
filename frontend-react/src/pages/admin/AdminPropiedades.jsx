import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Form, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import { mensajeDeError } from '../../api/cliente'
import { cambiarDisponibilidad, eliminarPropiedad, listarPropiedades } from '../../api/propiedades'
import ConfirmarEliminacion from '../../components/ConfirmarEliminacion'
import EstadoCarga from '../../components/EstadoCarga'
import { filtrarPropiedades } from '../../data/propiedades'
import { formatearPrecio } from '../../utils/formato'
import { esAdmin } from '../../utils/permisos'

// Listado de propiedades con búsqueda. El administrador además crea, edita y elimina;
// el anfitrión solo puede verlas (no le aparecen esos botones).
function AdminPropiedades({ usuario }) {
  const [propiedades, setPropiedades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [porEliminar, setPorEliminar] = useState(null) // propiedad esperando confirmación
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
  const puedeEditar = esAdmin(usuario)

  useEffect(() => {
    listarPropiedades()
      .then(setPropiedades)
      .catch((errorCarga) => setError(mensajeDeError(errorCarga)))
      .finally(() => setCargando(false))
  }, [])

  const resultado = filtrarPropiedades(propiedades, { texto: busqueda })

  // Activa o desactiva la propiedad para nuevas reservas
  async function alternarDisponibilidad(propiedad) {
    try {
      const actualizada = await cambiarDisponibilidad(propiedad.id)
      setPropiedades(propiedades.map((otra) => (otra.id === actualizada.id ? actualizada : otra)))
      setMensaje({
        tipo: 'success',
        texto: `"${actualizada.nombre}" ${actualizada.disponible ? 'ya acepta' : 'ya no acepta'} reservas.`,
      })
    } catch (errorCambio) {
      setMensaje({ tipo: 'danger', texto: mensajeDeError(errorCambio, 'No se pudo cambiar la disponibilidad.') })
    }
  }

  async function confirmarEliminacion() {
    const propiedad = porEliminar
    setPorEliminar(null)
    try {
      await eliminarPropiedad(propiedad.id)
      setPropiedades(propiedades.filter((otra) => otra.id !== propiedad.id))
      setMensaje({ tipo: 'success', texto: `Se eliminó "${propiedad.nombre}".` })
    } catch (errorEliminar) {
      setMensaje({ tipo: 'danger', texto: mensajeDeError(errorEliminar, 'No se pudo eliminar la propiedad.') })
    }
  }

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 className="titulo">Propiedades</h1>
          <p className="text-muted mb-0">{resultado.length} de {propiedades.length} propiedades.</p>
        </div>
        {puedeEditar && <Button as={Link} to="/admin/propiedades/nueva" variant="primary">Nueva propiedad</Button>}
      </div>

      {mensaje.texto && <Alert variant={mensaje.tipo}>{mensaje.texto}</Alert>}

      <Form.Group className="mb-3" controlId="buscar-propiedad">
        <Form.Label>Buscar por nombre o ubicación</Form.Label>
        <Form.Control
          type="search"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />
      </Form.Group>

      <EstadoCarga cargando={cargando} error={error}>
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
                      <div>
                        <strong>{propiedad.nombre}</strong>
                        {!propiedad.disponible && <div><Badge bg="secondary">No disponible</Badge></div>}
                      </div>
                    </div>
                  </td>
                  <td><Badge bg="secondary">{propiedad.tipo}</Badge></td>
                  <td>{propiedad.ubicacion}</td>
                  <td className="text-end">{formatearPrecio(propiedad.precio)}</td>
                  <td className="text-center text-nowrap">
                    <Button
                      as={Link}
                      to={`/propiedades/${propiedad.id}`}
                      variant="outline-secondary"
                      size="sm"
                      className="me-1"
                      aria-label={`Ver ${propiedad.nombre}`}
                    >
                      Ver
                    </Button>
                    {puedeEditar && (
                      <>
                        <Button
                          variant={propiedad.disponible ? 'outline-secondary' : 'outline-success'}
                          size="sm"
                          className="me-1"
                          aria-label={`${propiedad.disponible ? 'Desactivar' : 'Activar'} ${propiedad.nombre}`}
                          onClick={() => alternarDisponibilidad(propiedad)}
                        >
                          {propiedad.disponible ? 'Desactivar' : 'Activar'}
                        </Button>
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
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </EstadoCarga>

      <ConfirmarEliminacion
        nombre={porEliminar?.nombre}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setPorEliminar(null)}
      />
    </section>
  )
}

export default AdminPropiedades
