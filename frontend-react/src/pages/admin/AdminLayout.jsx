import { Col, Nav, Row } from 'react-bootstrap'
import { Navigate, NavLink, Outlet } from 'react-router-dom'
import '../../admin.css'

const OPCIONES = [
  { ruta: '/admin', texto: 'Home Admin', icono: '📊' },
  { ruta: '/admin/propiedades', texto: 'Propiedades', icono: '🏠' },
  { ruta: '/admin/propiedades/nueva', texto: 'Nueva propiedad', icono: '➕' },
  { ruta: '/admin/usuarios', texto: 'Usuarios', icono: '👥' },
  { ruta: '/admin/usuarios/nuevo', texto: 'Nuevo usuario', icono: '➕' },
]

// Estructura del panel: menú lateral y, en <Outlet />, la sección de la ruta actual.
// Solo entra un administrador; cualquier otro usuario se envía al inicio de sesión.
function AdminLayout({ usuario }) {
  if (usuario?.tipo !== 'Administrador') {
    return <Navigate to="/login" replace />
  }

  return (
    <Row className="g-0 panel-admin">
      <Col as="aside" md={3} xl={2} className="menu-admin p-3">
        <p className="fw-bold text-white mb-2">Panel Admin</p>
        <Nav className="flex-row flex-md-column gap-1">
          {OPCIONES.map((opcion) => (
            <Nav.Link key={opcion.ruta} as={NavLink} to={opcion.ruta} end>
              <span aria-hidden="true">{opcion.icono}</span> {opcion.texto}
            </Nav.Link>
          ))}
        </Nav>
      </Col>

      <Col md={9} xl={10} className="p-3 p-md-4">
        <Outlet />
      </Col>
    </Row>
  )
}

export default AdminLayout
