import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { calcularPrecio } from '../api/precios'
import PanelReserva from '../components/PanelReserva'
import { fechaHoy } from '../utils/formato'
import { ANFITRION, INQUILINO } from './datosPrueba'

// MS-Precios simulado
vi.mock('../api/precios')

const propiedad = {
  id: 1,
  nombre: 'Departamento con vista al mar',
  ubicacion: 'Viña del Mar, Valparaíso',
  imagen: '/img/img-tarjeta-1.avif',
  precio: 68000,
  capacidad: 4,
  disponible: true,
}

// Fecha "AAAA-MM-DD" a cierta cantidad de días desde hoy
function enDias(dias) {
  const fecha = new Date(fechaHoy() + 'T12:00:00')
  fecha.setDate(fecha.getDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

describe('PanelReserva', () => {
  beforeEach(() => {
    vi.clearAllMocks() // borra las llamadas registradas en la prueba anterior
    calcularPrecio.mockResolvedValue({ temporada: 'Alta', multiplicador: 1.5, noches: 4, subtotal: 272000, total: 408000 })
  })

  it('Muestra el error solo cuando se envía sin fechas, y no llama a onAgregar', async () => {
    const usuario = userEvent.setup()
    const onAgregar = vi.fn() // función simulada (mock) que reemplaza a la real
    render(<PanelReserva propiedad={propiedad} usuario={null} onAgregar={onAgregar} />)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Agregar a mis reservas' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Selecciona la fecha de llegada y de salida.')
    expect(onAgregar).not.toHaveBeenCalled()
    expect(calcularPrecio).not.toHaveBeenCalled()
  })

  it('Pide el precio a MS-Precios y entrega la estadía con el total de la temporada', async () => {
    const usuario = userEvent.setup()
    const onAgregar = vi.fn()
    render(<PanelReserva propiedad={propiedad} usuario={INQUILINO} onAgregar={onAgregar} />)

    const llegada = enDias(1)
    const salida = enDias(5)
    fireEvent.change(screen.getByLabelText('Llegada'), { target: { value: llegada } })
    fireEvent.change(screen.getByLabelText('Salida'), { target: { value: salida } })
    await usuario.selectOptions(screen.getByLabelText('Huéspedes'), '2')

    expect(await screen.findByText('$68.000 x 4 noches')).toBeInTheDocument()
    expect(calcularPrecio).toHaveBeenLastCalledWith(1, llegada, salida)
    expect(screen.getByText('Temporada Alta (×1.5)')).toBeInTheDocument()
    expect(screen.getByText('$408.000')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Agregar a mis reservas' }))

    expect(onAgregar).toHaveBeenCalledWith(
      expect.objectContaining({ propiedadId: 1, noches: 4, huespedes: 2, subtotal: 272000, total: 408000, temporada: 'Alta' }),
    )
  })

  it('Si MS-Precios falla, avisa y no deja agregar la estadía', async () => {
    calcularPrecio.mockRejectedValue({ response: { status: 500, data: { mensaje: 'No existen precios para esta propiedad' } } })
    render(<PanelReserva propiedad={propiedad} usuario={null} onAgregar={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Llegada'), { target: { value: enDias(1) } })
    fireEvent.change(screen.getByLabelText('Salida'), { target: { value: enDias(3) } })

    expect(await screen.findByText('No existen precios para esta propiedad')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agregar a mis reservas' })).toBeDisabled()
  })

  it('Un anfitrión no ve el formulario: las reservas son de los inquilinos', () => {
    render(<PanelReserva propiedad={propiedad} usuario={ANFITRION} onAgregar={vi.fn()} />)
    expect(screen.getByText('Las reservas las hacen las cuentas de inquilino.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Llegada')).not.toBeInTheDocument()
  })

  it('Una propiedad no disponible no se puede reservar', () => {
    render(<PanelReserva propiedad={{ ...propiedad, disponible: false }} usuario={INQUILINO} onAgregar={vi.fn()} />)
    expect(screen.getByText('Esta propiedad no está disponible para nuevas reservas.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Agregar a mis reservas' })).not.toBeInTheDocument()
  })
})
