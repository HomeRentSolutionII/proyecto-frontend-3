import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { obtenerPropiedad } from '../api/propiedades'
import Encabezado from '../components/Encabezado'
import RutaProtegida from '../components/RutaProtegida'
import DetallePropiedad from '../pages/DetallePropiedad'
import { ADMIN, ANFITRION, INQUILINO, PROPIEDADES } from './datosPrueba'

// MS-Propiedades simulado
vi.mock('../api/propiedades')

describe('Encabezado', () => {
  it('Muestra la cantidad de reservas y el botón Ingresar si no hay sesión', () => {
    render(<MemoryRouter><Encabezado cantidadReservas={3} usuario={null} onCerrarSesion={vi.fn()} /></MemoryRouter>)

    expect(screen.getByRole('button', { name: 'Mis reservas 3' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument()
    expect(screen.queryByText('Panel admin')).not.toBeInTheDocument()
  })

  it('Con un administrador muestra su nombre, el panel y cierra sesión con Salir', async () => {
    const usuario = userEvent.setup()
    const onCerrarSesion = vi.fn()
    render(<MemoryRouter><Encabezado cantidadReservas={0} usuario={ADMIN} onCerrarSesion={onCerrarSesion} /></MemoryRouter>)

    expect(screen.getByText('Hola, Administrador')).toBeInTheDocument()
    expect(screen.getByText('Panel admin')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Mis reservas/ })).not.toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Salir' }))
    expect(onCerrarSesion).toHaveBeenCalledTimes(1)
  })

  it('El anfitrión ve su panel y no ve Mis reservas; el inquilino, al revés', () => {
    const { unmount } = render(
      <MemoryRouter><Encabezado cantidadReservas={0} usuario={ANFITRION} onCerrarSesion={vi.fn()} /></MemoryRouter>,
    )
    expect(screen.getByText('Panel anfitrión')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Mis reservas/ })).not.toBeInTheDocument()
    unmount()

    render(<MemoryRouter><Encabezado cantidadReservas={1} usuario={INQUILINO} onCerrarSesion={vi.fn()} /></MemoryRouter>)
    expect(screen.queryByText(/Panel/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mis reservas 1' })).toBeInTheDocument()
  })
})

describe('RutaProtegida', () => {
  function renderizarCon(usuario) {
    render(
      <MemoryRouter initialEntries={['/privada']}>
        <Routes>
          <Route path="/login" element={<p>Página de login</p>} />
          <Route
            path="/privada"
            element={<RutaProtegida usuario={usuario} roles={['ADMIN']}><p>Contenido privado</p></RutaProtegida>}
          />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('Sin sesión envía al inicio de sesión', () => {
    renderizarCon(null)
    expect(screen.getByText('Página de login')).toBeInTheDocument()
  })

  it('Con un rol sin permiso muestra el aviso de acceso restringido', () => {
    renderizarCon(INQUILINO)
    expect(screen.getByRole('heading', { name: 'Acceso restringido' })).toBeInTheDocument()
    expect(screen.queryByText('Contenido privado')).not.toBeInTheDocument()
  })

  it('Con el rol correcto muestra la página', () => {
    renderizarCon(ADMIN)
    expect(screen.getByText('Contenido privado')).toBeInTheDocument()
  })
})

describe('DetallePropiedad', () => {
  beforeEach(() => {
    obtenerPropiedad.mockImplementation(async (id) => PROPIEDADES.find((propiedad) => propiedad.id === Number(id)) || null)
  })

  // MemoryRouter con initialEntries simula haber entrado a esa URL
  function renderizarEn(ruta) {
    render(
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/propiedades/:id" element={<DetallePropiedad usuario={null} onAgregarReserva={vi.fn()} />} />
        </Routes>
      </MemoryRouter>,
    )
  }

  it('Lee el id de la URL y pide esa propiedad al backend', async () => {
    renderizarEn('/propiedades/3')
    expect(await screen.findByRole('heading', { level: 1, name: 'Cabaña de montaña con tinaja' })).toBeInTheDocument()
    expect(screen.getByText('Tinaja')).toBeInTheDocument()
    expect(obtenerPropiedad).toHaveBeenCalledWith('3')
  })

  it('Si el id no existe, muestra el mensaje de propiedad no encontrada', async () => {
    renderizarEn('/propiedades/999')
    expect(await screen.findByText('Propiedad no encontrada')).toBeInTheDocument()
  })
})
