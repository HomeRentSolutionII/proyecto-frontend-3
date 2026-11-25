import { useState } from 'react'
import { Alert, Badge, Button, Table } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import ConfirmarEliminacion from '../../components/ConfirmarEliminacion'
import { eliminarUsuario, listarUsuarios } from '../../data/usuarios'

// Listado de usuarios. Recibe por props al administrador con sesión activa,
// porque no puede eliminar su propia cuenta.
function AdminUsuarios({ usuarioActual }) {
  const [usuarios, setUsuarios] = useState(() => listarUsuarios())
  const [porEliminar, setPorEliminar] = useState(null)
  const [mensaje, setMensaje] = useState('')

  function confirmarEliminacion() {
    eliminarUsuario(porEliminar.id)
    setUsuarios(listarUsuarios())
    setMensaje(`Se eliminó a ${porEliminar.nombre}.`)
    setPorEliminar(null)
  }

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <div>
          <h1 className="titulo">Usuarios</h1>
          <p className="text-muted mb-0">{usuarios.length} usuarios registrados.</p>
        </div>
        <Button as={Link} to="/admin/usuarios/nuevo" variant="primary">Nuevo usuario</Button>
      </div>

      {mensaje && <Alert variant="success">{mensaje}</Alert>}

      <Table responsive hover className="align-middle">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Correo</th>
            <th>RUN</th>
            <th>Tipo</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id}>
              <td><strong>{usuario.nombre} {usuario.apellidos}</strong></td>
              <td>{usuario.correo}</td>
              <td>{usuario.run}</td>
              <td><Badge bg="secondary">{usuario.tipo}</Badge></td>
              <td className="text-center text-nowrap">
                <Button
                  as={Link}
                  to={`/admin/usuarios/${usuario.id}/editar`}
                  variant="outline-dark"
                  size="sm"
                  className="me-1"
                  aria-label={`Editar ${usuario.nombre}`}
                >
                  Editar
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  aria-label={`Eliminar ${usuario.nombre}`}
                  disabled={usuario.id === usuarioActual?.id}
                  onClick={() => setPorEliminar(usuario)}
                >
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <ConfirmarEliminacion
        nombre={porEliminar?.nombre}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setPorEliminar(null)}
      />
    </section>
  )
}

export default AdminUsuarios
