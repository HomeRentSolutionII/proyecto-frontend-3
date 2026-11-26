import { useEffect, useState } from 'react'
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { mensajeDeError } from '../../api/cliente'
import { actualizarUsuario, crearUsuario, obtenerUsuario } from '../../api/usuarios'
import CampoFormulario from '../../components/CampoFormulario'
import EstadoCarga from '../../components/EstadoCarga'
import { TIPOS_USUARIO } from '../../data/usuarios'
import { validarUsuarioAdmin } from '../../utils/validacionesAdmin'

const FORMULARIO_VACIO = {
  run: '',
  nombre: '',
  apellidos: '',
  correo: '',
  tipo: 'Inquilino',
  direccion: '',
  clave: '',
  confirmarClave: '',
}

// El mismo formulario sirve para crear (/nuevo) y para editar (/:id/editar)
function FormularioUsuario() {
  const { id } = useParams()
  const navegar = useNavigate()
  const esEdicion = id !== undefined
  const [datos, setDatos] = useState(FORMULARIO_VACIO)
  const [carga, setCarga] = useState({ cargando: esEdicion, error: '', existe: true })
  const [errores, setErrores] = useState({})
  const [errorGuardar, setErrorGuardar] = useState('')
  const [guardando, setGuardando] = useState(false)

  // Al editar, se cargan los datos del usuario desde MS-Usuarios
  useEffect(() => {
    if (!esEdicion) return
    obtenerUsuario(id)
      .then((usuario) => {
        // se guardan también región, comuna y fecha de nacimiento, para no perderlas al guardar
        if (usuario) setDatos({ ...FORMULARIO_VACIO, ...usuario, clave: '', confirmarClave: '' })
        setCarga({ cargando: false, error: '', existe: Boolean(usuario) })
      })
      .catch((error) => setCarga({ cargando: false, error: mensajeDeError(error), existe: true }))
  }, [id, esEdicion])

  if (carga.cargando || carga.error) {
    return <EstadoCarga cargando={carga.cargando} error={carga.error} />
  }

  if (!carga.existe) {
    return (
      <section>
        <h1 className="titulo">Usuario no encontrado</h1>
        <Alert variant="warning">El usuario que quieres editar no existe.</Alert>
        <Button as={Link} to="/admin/usuarios" variant="primary">Volver al listado</Button>
      </section>
    )
  }

  function manejarCambio(evento) {
    setDatos({ ...datos, [evento.target.name]: evento.target.value })
  }

  async function manejarEnvio(evento) {
    evento.preventDefault()
    setErrorGuardar('')
    const nuevosErrores = validarUsuarioAdmin(datos, esEdicion)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    const usuarioListo = {
      ...datos,
      run: datos.run.trim().toUpperCase(),
      nombre: datos.nombre.trim(),
      apellidos: datos.apellidos.trim(),
      correo: datos.correo.trim().toLowerCase(),
      direccion: datos.direccion.trim(),
    }
    delete usuarioListo.confirmarClave

    // Al editar, si la contraseña queda vacía MS-Usuarios mantiene la que tenía
    setGuardando(true)
    try {
      if (esEdicion) {
        await actualizarUsuario(id, usuarioListo)
      } else {
        await crearUsuario(usuarioListo)
      }
      navegar('/admin/usuarios')
    } catch (error) {
      const mensaje = mensajeDeError(error, 'No se pudo guardar el usuario.')
      // 409: el correo o el RUN ya pertenecen a otra cuenta. Se muestra bajo ese campo.
      if (error.response?.status === 409 && mensaje.includes('correo')) {
        setErrores({ correo: 'Ya existe una cuenta con este correo.' })
      } else if (error.response?.status === 409 && mensaje.includes('RUN')) {
        setErrores({ run: 'Ya existe una cuenta con este RUN.' })
      } else {
        setErrorGuardar(mensaje)
      }
      setGuardando(false)
    }
  }

  return (
    <section>
      <h1 className="titulo">{esEdicion ? 'Editar usuario' : 'Nuevo usuario'}</h1>
      <p className="text-muted">
        Los campos marcados con <span className="text-danger">*</span> son obligatorios.
      </p>

      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <Form onSubmit={manejarEnvio} noValidate>
            <Row>
              <Col md={6}>
                <CampoFormulario id="nombre" etiqueta="Nombre" obligatorio error={errores.nombre}>
                  <Form.Control name="nombre" maxLength={50}
                    value={datos.nombre} onChange={manejarCambio} isInvalid={!!errores.nombre} />
                </CampoFormulario>
              </Col>
              <Col md={6}>
                <CampoFormulario id="apellidos" etiqueta="Apellidos" obligatorio error={errores.apellidos}>
                  <Form.Control name="apellidos" maxLength={100}
                    value={datos.apellidos} onChange={manejarCambio} isInvalid={!!errores.apellidos} />
                </CampoFormulario>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <CampoFormulario id="run" etiqueta="RUN" obligatorio error={errores.run}
                  ayuda="Sin puntos ni guion, entre 7 y 9 caracteres.">
                  <Form.Control name="run" maxLength={9} placeholder="21456789K"
                    value={datos.run} onChange={manejarCambio} isInvalid={!!errores.run} />
                </CampoFormulario>
              </Col>
              <Col md={6}>
                <CampoFormulario id="correo" etiqueta="Correo electrónico" obligatorio error={errores.correo}
                  ayuda="Solo @duoc.cl, @profesor.duoc.cl y @gmail.com">
                  <Form.Control type="email" name="correo" maxLength={100} placeholder="nombre@duoc.cl"
                    value={datos.correo} onChange={manejarCambio} isInvalid={!!errores.correo} />
                </CampoFormulario>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <CampoFormulario id="tipo" etiqueta="Tipo de usuario" obligatorio error={errores.tipo}>
                  <Form.Select name="tipo" value={datos.tipo} onChange={manejarCambio} isInvalid={!!errores.tipo}>
                    {TIPOS_USUARIO.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </Form.Select>
                </CampoFormulario>
              </Col>
              <Col md={6}>
                <CampoFormulario id="direccion" etiqueta="Dirección" ayuda="Campo opcional.">
                  <Form.Control name="direccion" maxLength={300} value={datos.direccion} onChange={manejarCambio} />
                </CampoFormulario>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <CampoFormulario id="clave" etiqueta="Contraseña" obligatorio={!esEdicion} error={errores.clave}
                  ayuda={esEdicion ? 'Déjala vacía para mantener la actual.' : 'Entre 4 y 10 caracteres.'}>
                  <Form.Control type="password" name="clave" maxLength={10} autoComplete="new-password"
                    value={datos.clave} onChange={manejarCambio} isInvalid={!!errores.clave} />
                </CampoFormulario>
              </Col>
              <Col md={6}>
                <CampoFormulario id="confirmarClave" etiqueta="Confirmar contraseña" obligatorio={!esEdicion}
                  error={errores.confirmarClave}>
                  <Form.Control type="password" name="confirmarClave" maxLength={10} autoComplete="new-password"
                    value={datos.confirmarClave} onChange={manejarCambio} isInvalid={!!errores.confirmarClave} />
                </CampoFormulario>
              </Col>
            </Row>

            {errorGuardar && <Alert variant="danger">{errorGuardar}</Alert>}

            <div className="d-flex flex-wrap gap-2">
              <Button type="submit" variant="primary" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar usuario'}
              </Button>
              <Button as={Link} to="/admin/usuarios" variant="outline-dark">Cancelar</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </section>
  )
}

export default FormularioUsuario
