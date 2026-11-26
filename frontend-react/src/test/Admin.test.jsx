import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listarAnfitriones } from '../api/anfitriones'
import { eliminarMensaje, listarMensajes } from '../api/contacto'
import {
  actualizarPropiedad,
  cambiarDisponibilidad,
  crearPropiedad,
  eliminarPropiedad,
  listarPropiedades,
  obtenerPropiedad,
} from '../api/propiedades'
import { listarReservas, obtenerDetalleReserva } from '../api/reservas'
import { actualizarUsuario, crearUsuario, eliminarUsuario, listarUsuarios, obtenerUsuario } from '../api/usuarios'
import RutaProtegida from '../components/RutaProtegida'
import AdminInicio from '../pages/admin/AdminInicio'
import AdminLayout from '../pages/admin/AdminLayout'
import AdminMensajes from '../pages/admin/AdminMensajes'
import AdminPropiedades from '../pages/admin/AdminPropiedades'
import AdminReservas from '../pages/admin/AdminReservas'
import AdminUsuarios from '../pages/admin/AdminUsuarios'
import DetalleReserva from '../pages/admin/DetalleReserva'
import FormularioPropiedad from '../pages/admin/FormularioPropiedad'
import FormularioUsuario from '../pages/admin/FormularioUsuario'
import { validarPropiedad, validarUsuarioAdmin } from '../utils/validacionesAdmin'
import { ADMIN, ANFITRION, ANFITRIONES, INQUILINO, MENSAJES, PROPIEDADES, RESERVAS, USUARIOS } from './datosPrueba'

// Todos los microservicios simulados: las pruebas no necesitan el backend encendido
vi.mock('../api/propiedades')
vi.mock('../api/usuarios')
vi.mock('../api/contacto')
vi.mock('../api/anfitriones')
vi.mock('../api/reservas', async (importOriginal) => ({
  ...(await importOriginal()), // se mantiene ESTADOS_RESERVA
  listarReservas: vi.fn(),
  obtenerDetalleReserva: vi.fn(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  listarPropiedades.mockResolvedValue(PROPIEDADES)
  obtenerPropiedad.mockImplementation(async (id) => PROPIEDADES.find((propiedad) => propiedad.id === Number(id)) || null)
  crearPropiedad.mockImplementation(async (propiedad) => ({ ...propiedad, id: 21, disponible: true }))
  actualizarPropiedad.mockImplementation(async (id, propiedad) => ({ ...propiedad, id: Number(id) }))
  eliminarPropiedad.mockResolvedValue()
  cambiarDisponibilidad.mockImplementation(async (id) => ({ ...PROPIEDADES.find((p) => p.id === id), disponible: false }))
  listarUsuarios.mockResolvedValue(USUARIOS)
  obtenerUsuario.mockImplementation(async (id) => USUARIOS.find((usuario) => usuario.id === Number(id)) || null)
  crearUsuario.mockImplementation(async (datos) => ({ ...datos, id: 4 }))
  actualizarUsuario.mockImplementation(async (id, datos) => ({ ...datos, id: Number(id) }))
  eliminarUsuario.mockResolvedValue()
  listarReservas.mockResolvedValue(RESERVAS)
  listarMensajes.mockResolvedValue(MENSAJES)
  eliminarMensaje.mockResolvedValue()
  listarAnfitriones.mockResolvedValue(ANFITRIONES)
})

// Dibuja el panel en una URL, con las mismas rutas y permisos que App.jsx
function renderizarPanel(ruta, usuario = ADMIN) {
  const soloAdmin = (pagina) => <RutaProtegida usuario={usuario} roles={['ADMIN']}>{pagina}</RutaProtegida>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/login" element={<p>Página de login</p>} />
        <Route path="/admin" element={<AdminLayout usuario={usuario} />}>
          <Route index element={usuario?.rol === 'ADMIN' ? <AdminInicio /> : <Navigate to="propiedades" replace />} />
          <Route path="propiedades" element={<AdminPropiedades usuario={usuario} />} />
          <Route path="propiedades/nueva" element={soloAdmin(<FormularioPropiedad />)} />
          <Route path="propiedades/:id/editar" element={soloAdmin(<FormularioPropiedad />)} />
          <Route path="reservas" element={<AdminReservas />} />
          <Route path="reservas/:id" element={<DetalleReserva />} />
          <Route path="usuarios" element={soloAdmin(<AdminUsuarios usuarioActual={usuario} />)} />
          <Route path="usuarios/nuevo" element={soloAdmin(<FormularioUsuario />)} />
          <Route path="usuarios/:id/editar" element={soloAdmin(<FormularioUsuario />)} />
          <Route path="mensajes" element={soloAdmin(<AdminMensajes />)} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Reglas de validación del panel', () => {
  const propiedadValida = {
    nombre: 'Casa de prueba', tipo: 'Casa', ubicacion: 'Talca, Maule', precio: '50000', idAnfitrion: '1',
    capacidad: '4', habitaciones: '2', banos: '1', superficie: '80', descripcion: 'Casa cómoda.',
  }

  it('Acepta una propiedad correcta y marca los campos con problemas', () => {
    expect(validarPropiedad(propiedadValida)).toEqual({})

    const errores = validarPropiedad({ ...propiedadValida, nombre: ' ', tipo: '', precio: '500', capacidad: '1.5' })
    expect(Object.keys(errores)).toEqual(['nombre', 'tipo', 'precio', 'capacidad'])
    expect(errores.nombre).toBe('Completa el nombre.')
    expect(errores.precio).toBe('Debe ser un número entero de 1000 o más.')
    expect(validarPropiedad({ ...propiedadValida, idAnfitrion: '' }).idAnfitrion).toMatch(/anfitrión/)
  })

  it('Exige la contraseña al crear un usuario, pero no al editarlo', () => {
    const usuario = {
      run: '21456789K', nombre: 'Ana', apellidos: 'Soto', correo: 'ana@gmail.com',
      tipo: 'Inquilino', clave: '', confirmarClave: '',
    }
    expect(validarUsuarioAdmin(usuario, false).clave).toBe('La contraseña es obligatoria.')
    expect(validarUsuarioAdmin(usuario, true)).toEqual({})

    const distintas = { ...usuario, clave: 'clave1', confirmarClave: 'clave2' }
    expect(validarUsuarioAdmin(distintas, true).confirmarClave).toBe('Las contraseñas no coinciden.')
  })
})

describe('Acceso al panel según el rol', () => {
  it('Sin sesión redirige al inicio de sesión', () => {
    renderizarPanel('/admin', null)
    expect(screen.getByText('Página de login')).toBeInTheDocument()
    expect(screen.queryByText('Panel Admin')).not.toBeInTheDocument()
  })

  it('Un inquilino no puede entrar', () => {
    renderizarPanel('/admin/usuarios', INQUILINO)
    expect(screen.getByRole('heading', { name: 'Acceso restringido' })).toBeInTheDocument()
    expect(listarUsuarios).not.toHaveBeenCalled()
  })

  it('Un administrador ve todo el menú y el resumen', async () => {
    renderizarPanel('/admin')
    expect(screen.getByText('Panel Admin')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Usuarios/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mensajes/ })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Home Admin' })).toBeInTheDocument()
  })

  it('El anfitrión solo ve propiedades y reservas', async () => {
    renderizarPanel('/admin', ANFITRION)

    // /admin lo lleva directo a Propiedades
    expect(await screen.findByRole('heading', { level: 1, name: 'Propiedades' })).toBeInTheDocument()
    expect(screen.getByText('Panel Anfitrión')).toBeInTheDocument()
    const menu = screen.getAllByRole('link').filter((enlace) => enlace.closest('aside')).map((enlace) => enlace.textContent.trim())
    expect(menu).toEqual(['🏠 Propiedades', '📅 Reservas'])
  })

  it('Si el anfitrión escribe la URL de usuarios, ve el aviso de acceso restringido', () => {
    renderizarPanel('/admin/usuarios', ANFITRION)
    expect(screen.getByRole('heading', { name: 'Acceso restringido' })).toBeInTheDocument()
    expect(listarUsuarios).not.toHaveBeenCalled()
  })
})

describe('Home Admin', () => {
  it('Muestra las cifras que entregan los microservicios', async () => {
    renderizarPanel('/admin')

    // la tarjeta del resumen que tiene ese título ("Reservas" también aparece en el menú)
    const cifraDe = async (titulo) => {
      const textos = await screen.findAllByText(titulo)
      return textos.find((texto) => texto.closest('.dato-admin')).closest('.card').querySelector('.cifra')
    }
    expect(await cifraDe('Propiedades publicadas')).toHaveTextContent('20')
    expect(await cifraDe('Usuarios registrados')).toHaveTextContent('3')
    expect(await cifraDe('Reservas')).toHaveTextContent('2')
    expect(await cifraDe('Mensajes de contacto')).toHaveTextContent('1')
  })

  it('Lista los últimos mensajes con el motivo en texto legible', async () => {
    renderizarPanel('/admin')
    expect(await screen.findByText('Ayuda con una reserva')).toBeInTheDocument()
    expect(screen.getByText('Ana Soto')).toBeInTheDocument()
  })

  it('Si un microservicio falla, avisa en vez de mostrar cifras', async () => {
    listarUsuarios.mockRejectedValue(new Error('Network Error'))
    renderizarPanel('/admin')
    expect(await screen.findByText(/No se pudo conectar con el servidor/)).toBeInTheDocument()
  })
})

describe('Mantenedor de propiedades', () => {
  it('Lista todas las propiedades y las filtra con la búsqueda', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/propiedades')

    expect(await screen.findAllByRole('button', { name: /^Eliminar / })).toHaveLength(20)

    await usuario.type(screen.getByLabelText('Buscar por nombre o ubicación'), 'pucón')

    expect(screen.getAllByRole('button', { name: /^Eliminar / })).toHaveLength(1)
    expect(screen.getByText('Cabaña de montaña con tinaja')).toBeInTheDocument()
  })

  it('El anfitrión puede ver las propiedades, pero no crearlas, editarlas ni eliminarlas', async () => {
    renderizarPanel('/admin/propiedades', ANFITRION)

    expect(await screen.findAllByRole('button', { name: /^Ver / })).toHaveLength(20)
    expect(screen.queryByRole('button', { name: /^Eliminar / })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Editar / })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nueva propiedad' })).not.toBeInTheDocument()
  })

  it('Al eliminar pide confirmación, y Cancelar no borra nada', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/propiedades')

    await usuario.click(await screen.findByRole('button', { name: 'Eliminar Cabaña frente al lago' }))
    const ventana = screen.getByRole('dialog')
    expect(within(ventana).getByText('Cabaña frente al lago')).toBeInTheDocument()

    await usuario.click(within(ventana).getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(eliminarPropiedad).not.toHaveBeenCalled()
  })

  it('Al confirmar elimina la propiedad en MS-Propiedades y actualiza la tabla', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/propiedades')

    await usuario.click(await screen.findByRole('button', { name: 'Eliminar Cabaña frente al lago' }))
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))

    expect(eliminarPropiedad).toHaveBeenCalledWith(6)
    expect(await screen.findByText('Se eliminó "Cabaña frente al lago".')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Eliminar Cabaña frente al lago' })).not.toBeInTheDocument()
  })

  it('Desactiva una propiedad para que no reciba nuevas reservas', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/propiedades')

    await usuario.click(await screen.findByRole('button', { name: 'Desactivar Cabaña frente al lago' }))

    expect(cambiarDisponibilidad).toHaveBeenCalledWith(6)
    expect(await screen.findByText('"Cabaña frente al lago" ya no acepta reservas.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Activar Cabaña frente al lago' })).toBeInTheDocument()
  })

  it('El formulario vacío muestra errores y no crea nada', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/propiedades/nueva')

    await usuario.click(await screen.findByRole('button', { name: 'Guardar propiedad' }))

    expect(screen.getByText('Completa el nombre.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa el precio.')).toBeInTheDocument()
    expect(screen.getByText('Selecciona el anfitrión dueño de la propiedad.')).toBeInTheDocument()
    expect(crearPropiedad).not.toHaveBeenCalled()
  })

  it('Crea una propiedad con su anfitrión y vuelve al listado', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/propiedades/nueva')

    await usuario.type(await screen.findByLabelText(/Nombre de la propiedad/), 'Casa de prueba')
    await usuario.selectOptions(screen.getByLabelText(/Tipo de propiedad/), 'Casa')
    await usuario.selectOptions(screen.getByLabelText(/^Anfitrión/), 'Jenny Salamanca (jenny.salamanca@email.com)')
    await usuario.type(screen.getByLabelText(/Ubicación/), 'Talca, Maule')
    await usuario.type(screen.getByLabelText(/Precio por noche/), '50000')
    await usuario.type(screen.getByLabelText(/Capacidad/), '4')
    await usuario.type(screen.getByLabelText(/Habitaciones/), '2')
    await usuario.type(screen.getByLabelText(/Baños/), '1')
    await usuario.type(screen.getByLabelText(/Superficie/), '80')
    await usuario.type(screen.getByLabelText(/Descripción/), 'Casa cómoda.')
    await usuario.type(screen.getByLabelText(/Servicios/), 'WiFi, Patio')
    await usuario.click(screen.getByRole('button', { name: 'Guardar propiedad' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Propiedades' })).toBeInTheDocument()
    expect(crearPropiedad).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Casa de prueba', precio: 50000, capacidad: 4, idAnfitrion: 2, servicios: ['WiFi', 'Patio'] }),
    )
  })

  it('Al editar carga los datos de la propiedad y guarda el cambio', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/propiedades/3/editar')

    const campoPrecio = await screen.findByLabelText(/Precio por noche/)
    expect(screen.getByLabelText(/Nombre de la propiedad/)).toHaveValue('Cabaña de montaña con tinaja')
    expect(campoPrecio).toHaveValue(75000)

    await usuario.clear(campoPrecio)
    await usuario.type(campoPrecio, '80000')
    await usuario.click(screen.getByRole('button', { name: 'Guardar propiedad' }))

    expect(actualizarPropiedad).toHaveBeenCalledWith('3', expect.objectContaining({ precio: 80000 }))
    expect(actualizarPropiedad.mock.calls[0][1].servicios).toContain('Tinaja')
  })

  it('Si el backend rechaza los datos, muestra su mensaje y no sale del formulario', async () => {
    actualizarPropiedad.mockRejectedValue({ response: { status: 400, data: { mensaje: 'El precio debe ser mayor a 0' } } })
    const usuario = userEvent.setup()
    renderizarPanel('/admin/propiedades/3/editar')

    await usuario.click(await screen.findByRole('button', { name: 'Guardar propiedad' }))

    expect(await screen.findByText('El precio debe ser mayor a 0')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Editar propiedad' })).toBeInTheDocument()
  })

  it('Si el id no existe, avisa que la propiedad no se encontró', async () => {
    renderizarPanel('/admin/propiedades/999/editar')
    expect(await screen.findByRole('heading', { name: 'Propiedad no encontrada' })).toBeInTheDocument()
  })
})

describe('Mantenedor de usuarios', () => {
  it('El administrador no puede eliminar su propia cuenta, pero sí la de otros', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/usuarios')

    expect(await screen.findByRole('button', { name: 'Eliminar Administrador' })).toBeDisabled()

    await usuario.click(screen.getByRole('button', { name: 'Eliminar Pedro' }))
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))

    expect(eliminarUsuario).toHaveBeenCalledWith(3)
    expect(await screen.findByText('Se eliminó a Pedro.')).toBeInTheDocument()
  })

  // Rellena los campos obligatorios del formulario de usuario
  async function completarUsuario(usuario, correo) {
    await usuario.type(screen.getByLabelText(/^Nombre/), 'Ana')
    await usuario.type(screen.getByLabelText(/^Apellidos/), 'Soto')
    await usuario.type(screen.getByLabelText(/^RUN/), '21456789K')
    await usuario.type(screen.getByLabelText(/^Correo electrónico/), correo)
    await usuario.type(screen.getByLabelText(/^Contraseña/), 'clave1')
    await usuario.type(screen.getByLabelText(/^Confirmar contraseña/), 'clave1')
  }

  it('Crea un usuario en MS-Usuarios y vuelve al listado', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/usuarios/nuevo')

    await completarUsuario(usuario, 'ana@gmail.com')
    await usuario.selectOptions(screen.getByLabelText(/Tipo de usuario/), 'Anfitrión')
    await usuario.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Usuarios' })).toBeInTheDocument()
    expect(crearUsuario).toHaveBeenCalledWith(expect.objectContaining({ correo: 'ana@gmail.com', tipo: 'Anfitrión' }))
    expect(crearUsuario.mock.calls[0][0]).not.toHaveProperty('confirmarClave')
  })

  it('Si el correo ya existe (409), lo marca bajo el campo', async () => {
    crearUsuario.mockRejectedValue({ response: { status: 409, data: { mensaje: 'El correo ya está registrado' } } })
    const usuario = userEvent.setup()
    renderizarPanel('/admin/usuarios/nuevo')

    await completarUsuario(usuario, 'admin@duoc.cl')
    await usuario.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    expect(await screen.findByText('Ya existe una cuenta con este correo.')).toBeInTheDocument()
  })

  it('Al editar sin escribir contraseña la envía vacía y conserva los demás datos', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/usuarios/3/editar')

    expect(await screen.findByLabelText(/^Correo electrónico/)).toHaveValue('inquilino@duoc.cl')
    expect(screen.getByLabelText(/^Contraseña/)).toHaveValue('')

    await usuario.type(screen.getByLabelText(/^Apellidos/), ' Pérez')
    await usuario.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    expect(actualizarUsuario).toHaveBeenCalledWith(
      '3',
      expect.objectContaining({ apellidos: 'Gonzalez Pérez', clave: '', region: 'Biobío', comuna: 'Concepción' }),
    )
  })

  it('Si el id no existe, avisa que el usuario no se encontró', async () => {
    renderizarPanel('/admin/usuarios/999/editar')
    expect(await screen.findByRole('heading', { name: 'Usuario no encontrado' })).toBeInTheDocument()
  })
})

describe('Reservas del panel', () => {
  it('Lista las reservas con el nombre de la propiedad y filtra por estado', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/reservas', ANFITRION)

    expect(await screen.findByText('Casa familiar en barrio residencial')).toBeInTheDocument()
    expect(screen.getByText('Departamento con vista al mar')).toBeInTheDocument()

    await usuario.selectOptions(screen.getByLabelText('Estado'), 'Confirmada')

    expect(screen.getByText('1 de 2 reservas.')).toBeInTheDocument()
    expect(screen.queryByText('Departamento con vista al mar')).not.toBeInTheDocument()
  })

  it('El detalle muestra al inquilino, la temporada y el total', async () => {
    obtenerDetalleReserva.mockResolvedValue({
      ...RESERVAS[0], fechaLimitePago: '2026-11-23', ubicacion: 'Ñuñoa, Santiago', temporada: 'Alta',
      multiplicador: 1.5, inquilino: { nombre: 'Pedro Gonzalez', correo: 'inquilino@duoc.cl' },
    })
    renderizarPanel('/admin/reservas/2')

    expect(await screen.findByText('Pedro Gonzalez')).toBeInTheDocument()
    expect(obtenerDetalleReserva).toHaveBeenCalledWith('2')
    expect(screen.getByText('Alta (×1.5)')).toBeInTheDocument()
    expect(screen.getByText('$414.000')).toBeInTheDocument()
    expect(screen.getByText('Confirmada')).toBeInTheDocument()
  })
})

describe('Mensajes de contacto del panel', () => {
  it('Lista los mensajes y elimina uno después de confirmar', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/mensajes')

    expect(await screen.findByText('Necesito ayuda con mi reserva.')).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Eliminar el mensaje de Ana Soto' }))
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))

    expect(eliminarMensaje).toHaveBeenCalledWith(1)
    expect(await screen.findByText('Todavía no hay mensajes de contacto.')).toBeInTheDocument()
  })
})
