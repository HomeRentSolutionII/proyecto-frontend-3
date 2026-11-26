import { useEffect, useState } from 'react'
import { Alert, Button, Card, Form } from 'react-bootstrap'
import { mensajeDeError } from '../api/cliente'
import { calcularPrecio } from '../api/precios'
import { calcularNoches, fechaHoy, formatearPrecio } from '../utils/formato'
import { puedeReservar } from '../utils/permisos'
import { validarFechasReserva } from '../utils/validaciones'
import ResumenReserva from './ResumenReserva'

// Panel lateral del detalle: elige fechas y huéspedes, pide el precio a MS-Precios
// y entrega la estadía al componente padre mediante la prop onAgregar.
function PanelReserva({ propiedad, usuario, onAgregar }) {
  const [llegada, setLlegada] = useState('')
  const [salida, setSalida] = useState('')
  const [huespedes, setHuespedes] = useState('1')
  const [error, setError] = useState('')
  // Último precio calculado y para qué fechas ("llegada|salida")
  const [calculo, setCalculo] = useState({ fechas: '', precio: null, error: '' })

  const noches = calcularNoches(llegada, salida)
  const fechas = `${llegada}|${salida}`
  const fechasValidas = validarFechasReserva(llegada, salida) === ''

  // Cada vez que cambian las fechas (y son válidas) se pide el precio a MS-Precios
  useEffect(() => {
    if (!fechasValidas) return
    let vigente = true // si las fechas cambian antes de la respuesta, esa respuesta se descarta
    calcularPrecio(propiedad.id, llegada, salida)
      .then((precio) => {
        if (vigente) setCalculo({ fechas, precio, error: '' })
      })
      .catch((errorCalculo) => {
        if (vigente) {
          setCalculo({ fechas, precio: null, error: mensajeDeError(errorCalculo, 'No se pudo calcular el precio.') })
        }
      })
    return () => {
      vigente = false
    }
  }, [propiedad.id, llegada, salida, fechas, fechasValidas])

  // Solo sirve el cálculo de las fechas que están elegidas ahora
  const calculoActual = fechasValidas && calculo.fechas === fechas ? calculo : null
  const calculando = fechasValidas && !calculoActual

  function manejarEnvio(evento) {
    evento.preventDefault()
    const mensaje = validarFechasReserva(llegada, salida)
    setError(mensaje)
    if (mensaje || !calculoActual?.precio) return

    const { subtotal, total, temporada, multiplicador } = calculoActual.precio
    onAgregar({
      propiedadId: propiedad.id,
      nombre: propiedad.nombre,
      ubicacion: propiedad.ubicacion,
      imagen: propiedad.imagen,
      precio: propiedad.precio,
      llegada,
      salida,
      noches,
      huespedes: Number(huespedes),
      subtotal,
      temporada,
      multiplicador,
      total,
    })
  }

  // Opciones de 1 hasta la capacidad máxima de la propiedad
  const opcionesHuespedes = Array.from({ length: propiedad.capacidad }, (_, i) => i + 1)

  return (
    <Card className="panel-reserva shadow-sm">
      <Card.Body>
        <p className="precio fs-3 mb-0">{formatearPrecio(propiedad.precio)}</p>
        <p className="small text-muted">por noche, antes del ajuste por temporada</p>

        {!puedeReservar(usuario) && (
          <Alert variant="info" className="mb-0">Las reservas las hacen las cuentas de inquilino.</Alert>
        )}
        {puedeReservar(usuario) && !propiedad.disponible && (
          <Alert variant="warning" className="mb-0">Esta propiedad no está disponible para nuevas reservas.</Alert>
        )}
        {puedeReservar(usuario) && propiedad.disponible && (
          <Form onSubmit={manejarEnvio} noValidate>
            <Form.Group className="mb-3" controlId="llegada">
              <Form.Label>Llegada</Form.Label>
              <Form.Control
                type="date"
                min={fechaHoy()}
                value={llegada}
                onChange={(evento) => setLlegada(evento.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="salida">
              <Form.Label>Salida</Form.Label>
              <Form.Control
                type="date"
                min={llegada || fechaHoy()}
                value={salida}
                onChange={(evento) => setSalida(evento.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="huespedes">
              <Form.Label>Huéspedes</Form.Label>
              <Form.Select value={huespedes} onChange={(evento) => setHuespedes(evento.target.value)}>
                {opcionesHuespedes.map((numero) => (
                  <option key={numero} value={numero}>
                    {numero} {numero === 1 ? 'persona' : 'personas'}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {calculando && <p className="small text-muted">Calculando el precio...</p>}
            {calculoActual?.error && <Alert variant="warning" className="py-2">{calculoActual.error}</Alert>}
            {calculoActual?.precio && (
              <ResumenReserva
                etiqueta={`${formatearPrecio(propiedad.precio)} x ${noches} ${noches === 1 ? 'noche' : 'noches'}`}
                subtotal={calculoActual.precio.subtotal}
                total={calculoActual.precio.total}
                temporada={calculoActual.precio.temporada}
                multiplicador={calculoActual.precio.multiplicador}
              />
            )}

            {error && <Alert variant="danger" className="py-2">{error}</Alert>}

            <Button type="submit" variant="primary" className="w-100" disabled={calculando || Boolean(calculoActual?.error)}>
              Agregar a mis reservas
            </Button>
          </Form>
        )}

        <p className="small text-muted text-center mt-2 mb-0">No se te cobrará nada por ahora.</p>
      </Card.Body>
    </Card>
  )
}

export default PanelReserva
