import { useEffect, useState } from 'react'
import { Alert, Button, Card } from 'react-bootstrap'
import { mensajeDeError } from '../../api/cliente'
import { eliminarMensaje, listarMensajes } from '../../api/contacto'
import ConfirmarEliminacion from '../../components/ConfirmarEliminacion'
import EstadoCarga from '../../components/EstadoCarga'
import { formatearFecha } from '../../utils/formato'
import { textoMotivo } from '../../utils/validacionesContacto'

// Mensajes del formulario de contacto guardados en MS-Mensajería (solo el administrador)
function AdminMensajes() {
  const [mensajes, setMensajes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [porEliminar, setPorEliminar] = useState(null)
  const [aviso, setAviso] = useState({ tipo: '', texto: '' })

  useEffect(() => {
    listarMensajes()
      .then(setMensajes)
      .catch((errorCarga) => setError(mensajeDeError(errorCarga)))
      .finally(() => setCargando(false))
  }, [])

  async function confirmarEliminacion() {
    const mensaje = porEliminar
    setPorEliminar(null)
    try {
      await eliminarMensaje(mensaje.id)
      setMensajes(mensajes.filter((otro) => otro.id !== mensaje.id))
      setAviso({ tipo: 'success', texto: `Se eliminó el mensaje de ${mensaje.nombre}.` })
    } catch (errorEliminar) {
      setAviso({ tipo: 'danger', texto: mensajeDeError(errorEliminar, 'No se pudo eliminar el mensaje.') })
    }
  }

  return (
    <section>
      <h1 className="titulo">Mensajes de contacto</h1>
      <p className="text-muted">
        {mensajes.length} {mensajes.length === 1 ? 'mensaje recibido' : 'mensajes recibidos'}.
      </p>

      {aviso.texto && <Alert variant={aviso.tipo}>{aviso.texto}</Alert>}

      <EstadoCarga cargando={cargando} error={error}>
        {mensajes.length === 0 ? (
          <Alert variant="info">Todavía no hay mensajes de contacto.</Alert>
        ) : (
          mensajes.map((mensaje) => (
            <Card key={mensaje.id} className="mb-3">
              <Card.Body>
                <div className="d-flex flex-wrap justify-content-between gap-2">
                  <div>
                    <strong>{mensaje.nombre}</strong> · <a href={`mailto:${mensaje.correo}`}>{mensaje.correo}</a>
                    {mensaje.telefono && <span className="text-muted"> · {mensaje.telefono}</span>}
                    <div className="small text-muted">
                      {formatearFecha(mensaje.fecha)} · {textoMotivo(mensaje.motivo)}
                    </div>
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="align-self-start"
                    aria-label={`Eliminar el mensaje de ${mensaje.nombre}`}
                    onClick={() => setPorEliminar(mensaje)}
                  >
                    Eliminar
                  </Button>
                </div>
                <p className="mb-0 mt-2">{mensaje.mensaje}</p>
              </Card.Body>
            </Card>
          ))
        )}
      </EstadoCarga>

      <ConfirmarEliminacion
        nombre={porEliminar && `el mensaje de ${porEliminar.nombre}`}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setPorEliminar(null)}
      />
    </section>
  )
}

export default AdminMensajes
