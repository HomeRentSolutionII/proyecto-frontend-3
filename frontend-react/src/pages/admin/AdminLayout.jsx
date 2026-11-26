import { Col, Nav, Row } from 'react-bootstrap'
import { NavLink, Outlet } from 'react-router-dom'
import RutaProtegida from '../../components/RutaProtegida'
import { esAdmin } from '../../utils/permisos'
import '../../admin.css'

// Opciones del menú lateral. Las marcadas soloAdmin no aparecen para el anfitrión:
// según la pauta, el anfitrión (vendedor) solo ve las propiedades y las reservas.
const OPCIONES = [
  { ruta: '/admin', texto: 'Home Admin', icono: '📊', soloAdmin: true },
  { ruta: '/admin/propiedades', texto: 'Propiedades', icono: '🏠' },
  { ruta: '/admin/propiedades/nueva', texto: 'Nueva propiedad', icono: '➕', soloAdmin: true },
  { ruta: '/admin/reservas', texto: 'Reservas', icono: '📅' },
  { ruta: '/admin/usuarios', texto: 'Usuarios', icono: '👥', soloAdmin: true },
  { ruta: '/admin/usuarios/nuevo', texto: 'Nuevo usuario', icono: '➕', soloAdmin: true },
  { ruta: '/admin/mensajes', texto: 'Mensajes', icono: '✉️', soloAdmin: true },
]

// Estructura del panel: menú lateral y, en <Outlet />, la sección de la ruta actual.
// Entran el administrador y el anfitrión; sin sesión se va al inicio de sesión.
function AdminLayout({ usuario }) {
  const opciones = OPCIONES.filter((opcion) => !opcion.soloAdmin || esAdmin(usuario))

  return (
    <RutaProtegida usuario={usuario} roles={['ADMIN', 'ANFITRION']}>
      <Row className="g-0 panel-admin">
        <Col as="aside" md={3} xl={2} className="menu-admin p-3">
          <p className="fw-bold text-white mb-2">{esAdmin(usuario) ? 'Panel Admin' : 'Panel Anfitrión'}</p>
          <Nav className="flex-row flex-md-column gap-1">
            {opciones.map((opcion) => (
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
    </RutaProtegida>
  )
}

export default AdminLayout
