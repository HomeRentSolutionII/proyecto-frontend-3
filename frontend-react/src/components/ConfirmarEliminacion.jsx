import { Button, Modal } from 'react-bootstrap'

// Ventana que pide confirmar antes de eliminar. La usan los listados del panel.
function ConfirmarEliminacion({ nombre, onConfirmar, onCancelar }) {
  return (
    <Modal show={Boolean(nombre)} onHide={onCancelar} centered animation={false}>
      <Modal.Header closeButton>
        <Modal.Title as="h2" className="fs-5">Confirmar eliminación</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        ¿Seguro que quieres eliminar <strong>{nombre}</strong>? Esta acción no se puede deshacer.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-dark" onClick={onCancelar}>Cancelar</Button>
        <Button variant="outline-danger" onClick={onConfirmar}>Eliminar</Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ConfirmarEliminacion
