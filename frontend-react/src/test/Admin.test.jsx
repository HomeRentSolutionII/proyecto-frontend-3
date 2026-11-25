import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { guardarMensaje } from '../data/mensajes'
import { listarPropiedades, obtenerPropiedad } from '../data/propiedades'
import { agregarReserva } from '../data/reservas'
import { listarUsuarios, registrarUsuario, validarCredenciales } from '../data/usuarios'
import AdminInicio from '../pages/admin/AdminInicio'
import AdminLayout from '../pages/admin/AdminLayout'
import AdminPropiedades from '../pages/admin/AdminPropiedades'
import AdminUsuarios from '../pages/admin/AdminUsuarios'
import FormularioPropiedad from '../pages/admin/FormularioPropiedad'
import FormularioUsuario from '../pages/admin/FormularioUsuario'
import { validarPropiedad, validarUsuarioAdmin } from '../utils/validacionesAdmin'

const ADMIN = { id: 1, nombre: 'Administrador', tipo: 'Administrador' }

// Dibuja el panel completo en una URL, con sus rutas reales
function renderizarPanel(ruta, usuario = ADMIN) {
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/login" element={<p>Página de login</p>} />
        <Route path="/admin" element={<AdminLayout usuario={usuario} />}>
          <Route index element={<AdminInicio />} />
          <Route path="propiedades" element={<AdminPropiedades />} />
          <Route path="propiedades/nueva" element={<FormularioPropiedad />} />
          <Route path="propiedades/:id/editar" element={<FormularioPropiedad />} />
          <Route path="usuarios" element={<AdminUsuarios usuarioActual={usuario} />} />
          <Route path="usuarios/nuevo" element={<FormularioUsuario />} />
          <Route path="usuarios/:id/editar" element={<FormularioUsuario />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('Reglas de validación del panel', () => {
  const propiedadValida = {
    nombre: 'Casa de prueba', tipo: 'Casa', ubicacion: 'Talca, Maule', precio: '50000',
    capacidad: '4', habitaciones: '2', banos: '1', superficie: '80', descripcion: 'Casa cómoda.',
  }

  it('Acepta una propiedad correcta y marca los campos con problemas', () => {
    expect(validarPropiedad(propiedadValida)).toEqual({})

    const errores = validarPropiedad({ ...propiedadValida, nombre: ' ', tipo: '', precio: '500', capacidad: '1.5' })
    expect(Object.keys(errores)).toEqual(['nombre', 'tipo', 'precio', 'capacidad'])
    expect(errores.nombre).toBe('Completa el nombre.')
    expect(errores.precio).toBe('Debe ser un número entero de 1000 o más.')
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

describe('Acceso al panel', () => {
  it('Sin sesión redirige al inicio de sesión', () => {
    renderizarPanel('/admin', null)
    expect(screen.getByText('Página de login')).toBeInTheDocument()
    expect(screen.queryByText('Panel Admin')).not.toBeInTheDocument()
  })

  it('Un inquilino tampoco puede entrar', () => {
    renderizarPanel('/admin/usuarios', { id: 2, nombre: 'Ana', tipo: 'Inquilino' })
    expect(screen.getByText('Página de login')).toBeInTheDocument()
  })

  it('Un administrador ve el menú lateral y la sección de la ruta', () => {
    renderizarPanel('/admin')
    expect(screen.getByText('Panel Admin')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Home Admin' })).toBeInTheDocument()
  })
})

describe('Home Admin', () => {
  it('Muestra las cifras reales de la aplicación', () => {
    agregarReserva({ nombre: 'Loft', precio: 54000, noches: 2 })
    renderizarPanel('/admin')

    const cifraDe = (titulo) => screen.getByText(titulo).closest('.card').querySelector('.cifra')
    expect(cifraDe('Propiedades publicadas')).toHaveTextContent('20')
    expect(cifraDe('Usuarios registrados')).toHaveTextContent('1')
    expect(cifraDe('Reservas en curso')).toHaveTextContent('1')
    expect(cifraDe('Mensajes de contacto')).toHaveTextContent('0')
  })

  it('Lista los mensajes de contacto, o avisa si no hay', () => {
    renderizarPanel('/admin')
    expect(screen.getByText('Todavía no hay mensajes de contacto.')).toBeInTheDocument()
  })

  it('Traduce el motivo del mensaje a un texto legible', () => {
    guardarMensaje({ nombre: 'Ana', correo: 'ana@correo.cl', telefono: '', motivo: 'reserva', mensaje: 'Hola' })
    renderizarPanel('/admin')
    expect(screen.getByText('Ayuda con una reserva')).toBeInTheDocument()
  })
})

describe('Mantenedor de propiedades', () => {
  it('Lista todas las propiedades y las filtra con la búsqueda', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/propiedades')

    expect(screen.getAllByRole('button', { name: /^Eliminar / })).toHaveLength(20)

    await usuario.type(screen.getByLabelText('Buscar por nombre o ubicación'), 'pucón')

    expect(screen.getAllByRole('button', { name: /^Eliminar / })).toHaveLength(1)
    expect(screen.getByText('Cabaña de montaña con tinaja')).toBeInTheDocument()
  })

  it('Al eliminar pide confirmación, y Cancelar no borra nada', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/propiedades')

    await usuario.click(screen.getByRole('button', { name: 'Eliminar Cabaña frente al lago' }))
    const ventana = screen.getByRole('dialog')
    expect(within(ventana).getByText('Cabaña frente al lago')).toBeInTheDocument()

    await usuario.click(within(ventana).getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(listarPropiedades()).toHaveLength(20)
  })

  it('Al confirmar elimina la propiedad y actualiza la tabla', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/propiedades')

    await usuario.click(screen.getByRole('button', { name: 'Eliminar Cabaña frente al lago' }))
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))

    expect(listarPropiedades()).toHaveLength(19)
    expect(obtenerPropiedad(6)).toBeNull()
    expect(screen.getByText('Se eliminó "Cabaña frente al lago".')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Eliminar Cabaña frente al lago' })).not.toBeInTheDocument()
  })

  it('El formulario vacío muestra errores y no crea nada', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/propiedades/nueva')

    await usuario.click(screen.getByRole('button', { name: 'Guardar propiedad' }))

    expect(screen.getByText('Completa el nombre.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa el precio.')).toBeInTheDocument()
    expect(listarPropiedades()).toHaveLength(20)
  })

  it('Crea una propiedad y vuelve al listado', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/propiedades/nueva')

    await usuario.type(screen.getByLabelText(/Nombre de la propiedad/), 'Casa de prueba')
    await usuario.selectOptions(screen.getByLabelText(/Tipo de propiedad/), 'Casa')
    await usuario.type(screen.getByLabelText(/Ubicación/), 'Talca, Maule')
    await usuario.type(screen.getByLabelText(/Precio por noche/), '50000')
    await usuario.type(screen.getByLabelText(/Capacidad/), '4')
    await usuario.type(screen.getByLabelText(/Habitaciones/), '2')
    await usuario.type(screen.getByLabelText(/Baños/), '1')
    await usuario.type(screen.getByLabelText(/Superficie/), '80')
    await usuario.type(screen.getByLabelText(/Descripción/), 'Casa cómoda.')
    await usuario.type(screen.getByLabelText(/Servicios/), 'WiFi, Patio')
    await usuario.click(screen.getByRole('button', { name: 'Guardar propiedad' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Propiedades' })).toBeInTheDocument()
    const creada = obtenerPropiedad(21)
    expect(creada).toMatchObject({ nombre: 'Casa de prueba', precio: 50000, capacidad: 4 })
    expect(creada.servicios).toEqual(['WiFi', 'Patio'])
  })

  it('Al editar carga los datos de la propiedad y guarda el cambio', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/propiedades/3/editar')

    const campoPrecio = screen.getByLabelText(/Precio por noche/)
    expect(screen.getByLabelText(/Nombre de la propiedad/)).toHaveValue('Cabaña de montaña con tinaja')
    expect(campoPrecio).toHaveValue(75000)

    await usuario.clear(campoPrecio)
    await usuario.type(campoPrecio, '80000')
    await usuario.click(screen.getByRole('button', { name: 'Guardar propiedad' }))

    expect(obtenerPropiedad(3).precio).toBe(80000)
    expect(obtenerPropiedad(3).servicios).toContain('Tinaja')
    expect(listarPropiedades()).toHaveLength(20)
  })

  it('Si el id no existe, avisa que la propiedad no se encontró', () => {
    renderizarPanel('/admin/propiedades/999/editar')
    expect(screen.getByRole('heading', { name: 'Propiedad no encontrada' })).toBeInTheDocument()
  })
})

describe('Mantenedor de usuarios', () => {
  it('El administrador no puede eliminar su propia cuenta, pero sí la de otros', async () => {
    const usuario = userEvent.setup()
    registrarUsuario({ nombre: 'Ana', apellidos: 'Soto', correo: 'ana@gmail.com', run: '21456789K', clave: 'clave1' })
    renderizarPanel('/admin/usuarios')

    expect(screen.getByRole('button', { name: 'Eliminar Administrador' })).toBeDisabled()

    await usuario.click(screen.getByRole('button', { name: 'Eliminar Ana' }))
    await usuario.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar' }))

    expect(listarUsuarios().map((guardado) => guardado.nombre)).toEqual(['Administrador'])
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

  it('Crea un usuario y lo agrega al listado', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/usuarios/nuevo')

    await completarUsuario(usuario, 'ana@gmail.com')
    await usuario.selectOptions(screen.getByLabelText(/Tipo de usuario/), 'Anfitrión')
    await usuario.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Usuarios' })).toBeInTheDocument()
    expect(screen.getByText('ana@gmail.com')).toBeInTheDocument()
    expect(listarUsuarios()[1].tipo).toBe('Anfitrión')
    expect(listarUsuarios()[1]).not.toHaveProperty('confirmarClave')
  })

  it('No permite crear dos usuarios con el mismo correo', async () => {
    const usuario = userEvent.setup()
    renderizarPanel('/admin/usuarios/nuevo')

    await completarUsuario(usuario, 'admin@duoc.cl')
    await usuario.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    expect(screen.getByText('Ya existe una cuenta con este correo.')).toBeInTheDocument()
    expect(listarUsuarios()).toHaveLength(1)
  })

  it('Al editar sin escribir contraseña, mantiene la que tenía', async () => {
    const usuario = userEvent.setup()
    registrarUsuario({ nombre: 'Ana', apellidos: 'Soto', correo: 'ana@gmail.com', run: '21456789K', clave: 'clave1' })
    renderizarPanel('/admin/usuarios/2/editar')

    expect(screen.getByLabelText(/^Correo electrónico/)).toHaveValue('ana@gmail.com')
    expect(screen.getByLabelText(/^Contraseña/)).toHaveValue('')

    await usuario.type(screen.getByLabelText(/^Apellidos/), ' Pérez')
    await usuario.click(screen.getByRole('button', { name: 'Guardar usuario' }))

    expect(listarUsuarios()[1].apellidos).toBe('Soto Pérez')
    expect(validarCredenciales('ana@gmail.com', 'clave1')).not.toBeNull()
  })

  it('Si el id no existe, avisa que el usuario no se encontró', () => {
    renderizarPanel('/admin/usuarios/999/editar')
    expect(screen.getByRole('heading', { name: 'Usuario no encontrado' })).toBeInTheDocument()
  })
})
