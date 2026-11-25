import { useState } from 'react'
import { Alert, Button, Card, Col, Form, Row } from 'react-bootstrap'
import { Link, useNavigate, useParams } from 'react-router-dom'
import CampoFormulario from '../../components/CampoFormulario'
import {
  actualizarPropiedad,
  crearPropiedad,
  obtenerPropiedad,
  TIPOS_PROPIEDAD,
} from '../../data/propiedades'
import { validarPropiedad } from '../../utils/validacionesAdmin'

// Fotos disponibles en public/img
const IMAGENES = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((numero) => `/img/img-tarjeta-${numero}.avif`)

const FORMULARIO_VACIO = {
  nombre: '',
  tipo: '',
  ubicacion: '',
  precio: '',
  capacidad: '',
  habitaciones: '',
  banos: '',
  superficie: '',
  descripcion: '',
  imagen: IMAGENES[0],
  servicios: '',
  destacada: false,
}

// Convierte una propiedad guardada en los valores de texto del formulario
function aFormulario(propiedad) {
  return {
    ...FORMULARIO_VACIO,
    ...propiedad,
    precio: String(propiedad.precio ?? ''),
    capacidad: String(propiedad.capacidad ?? ''),
    habitaciones: String(propiedad.habitaciones ?? ''),
    banos: String(propiedad.banos ?? ''),
    superficie: String(propiedad.superficie ?? ''),
    servicios: (propiedad.servicios || []).join(', '),
  }
}

// El mismo formulario sirve para crear (/nueva) y para editar (/:id/editar)
function FormularioPropiedad() {
  const { id } = useParams()
  const navegar = useNavigate()
  const esEdicion = id !== undefined
  const [propiedad] = useState(() => (esEdicion ? obtenerPropiedad(id) : null))
  const [datos, setDatos] = useState(() => (propiedad ? aFormulario(propiedad) : FORMULARIO_VACIO))
  const [errores, setErrores] = useState({})

  if (esEdicion && !propiedad) {
    return (
      <section>
        <h1 className="titulo">Propiedad no encontrada</h1>
        <Alert variant="warning">La propiedad que quieres editar no existe.</Alert>
        <Button as={Link} to="/admin/propiedades" variant="primary">Volver al listado</Button>
      </section>
    )
  }

  function manejarCambio(evento) {
    const { name, value, type, checked } = evento.target
    setDatos({ ...datos, [name]: type === 'checkbox' ? checked : value })
  }

  function manejarEnvio(evento) {
    evento.preventDefault()
    const nuevosErrores = validarPropiedad(datos)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    const propiedadLista = {
      ...datos,
      nombre: datos.nombre.trim(),
      ubicacion: datos.ubicacion.trim(),
      descripcion: datos.descripcion.trim(),
      alt: datos.nombre.trim(),
      precio: Number(datos.precio),
      capacidad: Number(datos.capacidad),
      habitaciones: Number(datos.habitaciones),
      banos: Number(datos.banos),
      superficie: Number(datos.superficie),
      servicios: datos.servicios.split(',').map((servicio) => servicio.trim()).filter(Boolean),
    }

    if (esEdicion) {
      actualizarPropiedad(id, propiedadLista)
    } else {
      crearPropiedad(propiedadLista)
    }
    navegar('/admin/propiedades')
  }

  return (
    <section>
      <h1 className="titulo">{esEdicion ? 'Editar propiedad' : 'Nueva propiedad'}</h1>
      <p className="text-muted">
        Los campos marcados con <span className="text-danger">*</span> son obligatorios.
      </p>

      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <Form onSubmit={manejarEnvio} noValidate>
            <Row>
              <Col md={6}>
                <CampoFormulario id="nombre" etiqueta="Nombre de la propiedad" obligatorio error={errores.nombre}>
                  <Form.Control name="nombre" maxLength={100} placeholder="Ej: Departamento en el centro"
                    value={datos.nombre} onChange={manejarCambio} isInvalid={!!errores.nombre} />
                </CampoFormulario>
              </Col>
              <Col md={6}>
                <CampoFormulario id="tipo" etiqueta="Tipo de propiedad" obligatorio error={errores.tipo}>
                  <Form.Select name="tipo" value={datos.tipo} onChange={manejarCambio} isInvalid={!!errores.tipo}>
                    <option value="">Seleccionar tipo</option>
                    {TIPOS_PROPIEDAD.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </Form.Select>
                </CampoFormulario>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <CampoFormulario id="ubicacion" etiqueta="Ubicación" obligatorio error={errores.ubicacion}>
                  <Form.Control name="ubicacion" maxLength={100} placeholder="Ej: Talca, Maule"
                    value={datos.ubicacion} onChange={manejarCambio} isInvalid={!!errores.ubicacion} />
                </CampoFormulario>
              </Col>
              <Col md={6}>
                <CampoFormulario id="precio" etiqueta="Precio por noche" obligatorio error={errores.precio}>
                  <Form.Control type="number" name="precio" min="1000" placeholder="Ej: 65000"
                    value={datos.precio} onChange={manejarCambio} isInvalid={!!errores.precio} />
                </CampoFormulario>
              </Col>
            </Row>

            <Row>
              <Col xs={6} lg={3}>
                <CampoFormulario id="capacidad" etiqueta="Capacidad" obligatorio error={errores.capacidad}>
                  <Form.Control type="number" name="capacidad" min="1"
                    value={datos.capacidad} onChange={manejarCambio} isInvalid={!!errores.capacidad} />
                </CampoFormulario>
              </Col>
              <Col xs={6} lg={3}>
                <CampoFormulario id="habitaciones" etiqueta="Habitaciones" obligatorio error={errores.habitaciones}>
                  <Form.Control type="number" name="habitaciones" min="1"
                    value={datos.habitaciones} onChange={manejarCambio} isInvalid={!!errores.habitaciones} />
                </CampoFormulario>
              </Col>
              <Col xs={6} lg={3}>
                <CampoFormulario id="banos" etiqueta="Baños" obligatorio error={errores.banos}>
                  <Form.Control type="number" name="banos" min="1"
                    value={datos.banos} onChange={manejarCambio} isInvalid={!!errores.banos} />
                </CampoFormulario>
              </Col>
              <Col xs={6} lg={3}>
                <CampoFormulario id="superficie" etiqueta="Superficie (m²)" obligatorio error={errores.superficie}>
                  <Form.Control type="number" name="superficie" min="1"
                    value={datos.superficie} onChange={manejarCambio} isInvalid={!!errores.superficie} />
                </CampoFormulario>
              </Col>
            </Row>

            <CampoFormulario id="descripcion" etiqueta="Descripción" obligatorio error={errores.descripcion}
              ayuda="Máximo 500 caracteres.">
              <Form.Control as="textarea" rows={3} name="descripcion" maxLength={500}
                value={datos.descripcion} onChange={manejarCambio} isInvalid={!!errores.descripcion} />
            </CampoFormulario>

            <CampoFormulario id="servicios" etiqueta="Servicios" ayuda="Separados por coma. Ej: WiFi, Estacionamiento">
              <Form.Control name="servicios" value={datos.servicios} onChange={manejarCambio} />
            </CampoFormulario>

            <Row className="align-items-center">
              <Col md={6}>
                <CampoFormulario id="imagen" etiqueta="Imagen">
                  <Form.Select name="imagen" value={datos.imagen} onChange={manejarCambio}>
                    {IMAGENES.map((imagen, indice) => (
                      <option key={imagen} value={imagen}>Foto {indice + 1}</option>
                    ))}
                  </Form.Select>
                </CampoFormulario>
              </Col>
              <Col md={6} className="mb-3">
                <Form.Check id="destacada" name="destacada" label="Mostrar en propiedades destacadas del inicio"
                  checked={datos.destacada} onChange={manejarCambio} />
              </Col>
            </Row>

            <div className="d-flex flex-wrap gap-2">
              <Button type="submit" variant="primary">Guardar propiedad</Button>
              <Button as={Link} to="/admin/propiedades" variant="outline-dark">Cancelar</Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </section>
  )
}

export default FormularioPropiedad
