import { Alert, Button, Container } from 'react-bootstrap'
import { Link, Navigate } from 'react-router-dom'

// Envuelve una página que solo pueden ver ciertos roles.
// Sin sesión → al inicio de sesión. Con sesión pero sin el rol → aviso de acceso restringido.
function RutaProtegida({ usuario, roles, children }) {
  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  if (!roles.includes(usuario.rol)) {
    return (
      <Container className="py-5">
        <h1 className="titulo">Acceso restringido</h1>
        <Alert variant="warning">Tu cuenta ({usuario.tipo}) no tiene permiso para ver esta página.</Alert>
        <Button as={Link} to="/" variant="primary">Volver al inicio</Button>
      </Container>
    )
  }

  return children
}

export default RutaProtegida
