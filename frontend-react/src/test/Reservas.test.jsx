import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listarPropiedades } from '../api/propiedades'
import { crearReserva, listarReservas } from '../api/reservas'
import Reservas from '../pages/Reservas'
import { INQUILINO, PROPIEDADES, RESERVAS } from './datosPrueba'

// MS-Reservas y MS-Propiedades simulados
vi.mock('../api/reservas', async (importOriginal) => ({
  ...(await importOriginal()), // se mantiene ESTADOS_RESERVA
  crearReserva: vi.fn(),
  listarReservas: vi.fn(),
}))
vi.mock('../api/propiedades')

// Estadías del carrito, con el precio que calculó MS-Precios
const carrito = [
  { id: 1, propiedadId: 4, nombre: 'Loft céntrico', ubicacion: 'Providencia, Santiago', imagen: '', precio: 54000,
    llegada: '2026-12-02', salida: '2026-12-04', noches: 2, subtotal: 108000, temporada: 'Alta', total: 162000 },
  { id: 2, propiedadId: 6, nombre: 'Cabaña frente al lago', ubicacion: 'Puerto Varas, Los Lagos', imagen: '',
    precio: 79000, llegada: '2027-07-10', salida: '2027-07-13', noches: 3, subtotal: 237000, temporada: 'Baja',
    total: 189600 },
]

function renderizar(props) {
  render(
    <MemoryRouter>
      <Reservas reservas={[]} usuario={null} onQuitar={vi.fn()} onConfirmar={vi.fn()} {...props} />
    </MemoryRouter>,
  )
}

describe('Página Mis reservas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listarReservas.mockResolvedValue(RESERVAS)
    listarPropiedades.mockResolvedValue(PROPIEDADES)
    crearReserva.mockResolvedValue({ id: 10, estado: 'PENDIENTE' })
  })

  it('Sin estadías muestra un aviso en lugar de la tabla', () => {
    renderizar()
    expect(screen.getByText('No tienes estadías por confirmar.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('Lista las estadías y suma el subtotal y el total con la temporada', () => {
    renderizar({ reservas: carrito })

    expect(screen.getAllByRole('row')).toHaveLength(3) // encabezado + 2 estadías
    expect(screen.getByText('Subtotal (2 propiedades)')).toBeInTheDocument()
    expect(screen.getByText('$345.000')).toBeInTheDocument() // 108.000 + 237.000
    expect(screen.getByText('+$6.600')).toBeInTheDocument() // alta sube, baja descuenta
    expect(screen.getByText('$351.600')).toBeInTheDocument() // 162.000 + 189.600
  })

  it('Al pulsar Quitar llama a onQuitar con el id de esa estadía', async () => {
    const usuario = userEvent.setup()
    const onQuitar = vi.fn()
    renderizar({ reservas: carrito, onQuitar })

    await usuario.click(screen.getByRole('button', { name: 'Quitar Cabaña frente al lago' }))

    expect(onQuitar).toHaveBeenCalledWith(2)
  })

  it('Sin sesión, el botón Confirmar lleva a iniciar sesión y no se ven reservas del backend', () => {
    renderizar({ reservas: carrito })

    expect(screen.getByText('Necesitas iniciar sesión para confirmar.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar reserva' })).toHaveAttribute('href', '/login')
    expect(listarReservas).not.toHaveBeenCalled()
  })

  it('El inquilino ve sus reservas realizadas, con el nombre de la propiedad y el estado', async () => {
    renderizar({ usuario: INQUILINO })

    const historial = await screen.findByText('Casa familiar en barrio residencial')
    const fila = historial.closest('tr')
    expect(within(fila).getByText('Confirmada')).toBeInTheDocument()
    expect(within(fila).getByText('$414.000')).toBeInTheDocument()
  })

  it('Al confirmar crea una reserva por estadía en MS-Reservas y avisa a App cuáles salieron', async () => {
    const usuario = userEvent.setup()
    const onConfirmar = vi.fn()
    renderizar({ reservas: carrito, usuario: INQUILINO, onConfirmar })

    await usuario.click(screen.getByRole('button', { name: 'Confirmar reserva' }))

    expect(await screen.findByText(/Registramos tus 2 reservas/)).toBeInTheDocument()
    expect(crearReserva).toHaveBeenCalledTimes(2)
    expect(crearReserva).toHaveBeenCalledWith(expect.objectContaining({ propiedadId: 4, llegada: '2026-12-02' }))
    expect(onConfirmar).toHaveBeenCalledWith([1, 2])
  })

  it('Si una estadía falla, se informa y solo salen del carrito las que se crearon', async () => {
    crearReserva
      .mockResolvedValueOnce({ id: 10 })
      .mockRejectedValueOnce({ response: { status: 409, data: { mensaje: 'La propiedad ya no está disponible.' } } })
    const usuario = userEvent.setup()
    const onConfirmar = vi.fn()
    renderizar({ reservas: carrito, usuario: INQUILINO, onConfirmar })

    await usuario.click(screen.getByRole('button', { name: 'Confirmar reserva' }))

    expect(await screen.findByText('Cabaña frente al lago: La propiedad ya no está disponible.')).toBeInTheDocument()
    expect(onConfirmar).toHaveBeenCalledWith([1])
  })
})
