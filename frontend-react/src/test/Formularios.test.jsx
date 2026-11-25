import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
/* [P3-1] DESCOMENTAR: borra esta línea y la que dice "FIN [P3-1]"
import { iniciarSesion, registrar } from '../api/auth'
FIN [P3-1] */
import Login from '../pages/Login'
import Registro from '../pages/Registro'

/* [P3-1] DESCOMENTAR: borra esta línea y la que dice "FIN [P3-1]"
// Las páginas ya no leen localStorage: llaman a MS-Usuarios. En las pruebas esas llamadas se
// reemplazan por funciones simuladas (vi.fn), así no hace falta tener el backend encendido.
vi.mock('../api/auth', () => ({ iniciarSesion: vi.fn(), registrar: vi.fn() }))
FIN [P3-1] */

describe('Formulario de inicio de sesión', () => {
  // [P3-1] BORRAR desde aquí (pruebas de la versión con localStorage)
  it('Muestra un error si las credenciales no corresponden a ningún usuario', async () => {
    const usuario = userEvent.setup()
    const onIniciarSesion = vi.fn()
    render(<MemoryRouter><Login onIniciarSesion={onIniciarSesion} /></MemoryRouter>)

    await usuario.type(screen.getByLabelText(/Correo electrónico/), 'nadie@gmail.com')
    await usuario.type(screen.getByLabelText(/Contraseña/), 'clave1')
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(screen.getByText('Correo o contraseña incorrectos.')).toBeInTheDocument()
    expect(onIniciarSesion).not.toHaveBeenCalled()
  })

  it('Con credenciales válidas llama a onIniciarSesion con el usuario', async () => {
    const usuario = userEvent.setup()
    const onIniciarSesion = vi.fn()
    render(<MemoryRouter><Login onIniciarSesion={onIniciarSesion} /></MemoryRouter>)

    // Usuario administrador de prueba definido en data/usuarios.js
    await usuario.type(screen.getByLabelText(/Correo electrónico/), 'admin@duoc.cl')
    await usuario.type(screen.getByLabelText(/Contraseña/), 'admin123')
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(onIniciarSesion).toHaveBeenCalledWith(expect.objectContaining({ tipo: 'Administrador' }))
  })
  // [P3-1] BORRAR hasta aquí

  /* [P3-1] DESCOMENTAR: borra esta línea y la que dice "FIN [P3-1]"
  it('Muestra un error si MS-Usuarios rechaza las credenciales (401)', async () => {
    iniciarSesion.mockRejectedValue({ response: { status: 401 } })
    const usuario = userEvent.setup()
    const onIniciarSesion = vi.fn()
    render(<MemoryRouter><Login onIniciarSesion={onIniciarSesion} /></MemoryRouter>)

    await usuario.type(screen.getByLabelText(/Correo electrónico/), 'nadie@gmail.com')
    await usuario.type(screen.getByLabelText(/Contraseña/), 'clave1')
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeInTheDocument()
    expect(onIniciarSesion).not.toHaveBeenCalled()
  })

  it('Si el backend no responde, avisa que no hay conexión', async () => {
    iniciarSesion.mockRejectedValue(new Error('Network Error'))
    const usuario = userEvent.setup()
    render(<MemoryRouter><Login onIniciarSesion={vi.fn()} /></MemoryRouter>)

    await usuario.type(screen.getByLabelText(/Correo electrónico/), 'nadie@gmail.com')
    await usuario.type(screen.getByLabelText(/Contraseña/), 'clave1')
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(await screen.findByText(/No se pudo conectar con el servidor/)).toBeInTheDocument()
  })

  it('Con credenciales válidas llama a onIniciarSesion con los tokens y el usuario', async () => {
    const respuesta = { tokenAcceso: 'a', tokenRenovacion: 'r', usuario: { nombre: 'Administrador', rol: 'ADMIN' } }
    iniciarSesion.mockResolvedValue(respuesta)
    const usuario = userEvent.setup()
    const onIniciarSesion = vi.fn()
    render(<MemoryRouter><Login onIniciarSesion={onIniciarSesion} /></MemoryRouter>)

    await usuario.type(screen.getByLabelText(/Correo electrónico/), 'admin@duoc.cl')
    await usuario.type(screen.getByLabelText(/Contraseña/), 'admin123')
    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }))

    expect(iniciarSesion).toHaveBeenCalledWith('admin@duoc.cl', 'admin123')
    await vi.waitFor(() => expect(onIniciarSesion).toHaveBeenCalledWith(respuesta))
  })
  FIN [P3-1] */

  it('El botón de administrador de prueba rellena el formulario', async () => {
    const usuario = userEvent.setup()
    render(<MemoryRouter><Login onIniciarSesion={vi.fn()} /></MemoryRouter>)

    await usuario.click(screen.getByRole('button', { name: 'Usar cuenta de administrador de prueba' }))

    expect(screen.getByLabelText(/Correo electrónico/)).toHaveValue('admin@duoc.cl')
    expect(screen.getByLabelText(/Contraseña/)).not.toHaveValue('')
  })

  it('Si ya hay sesión de administrador, muestra el aviso y el acceso al panel', async () => {
    const usuario = userEvent.setup()
    const onCerrarSesion = vi.fn()
    const admin = { nombre: 'Administrador', tipo: 'Administrador' }
    render(<MemoryRouter><Login usuario={admin} onIniciarSesion={vi.fn()} onCerrarSesion={onCerrarSesion} /></MemoryRouter>)

    expect(screen.getByText('Administrador')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Correo electrónico/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ir al panel de administración' })).toHaveAttribute('href', '/admin')

    await usuario.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(onCerrarSesion).toHaveBeenCalledTimes(1)
  })
})

describe('Formulario de registro', () => {
  it('Actualiza el estado del campo cuando el usuario escribe', async () => {
    const usuario = userEvent.setup()
    render(<MemoryRouter><Registro /></MemoryRouter>)

    const campoNombre = screen.getByLabelText(/^Nombre/)
    await usuario.type(campoNombre, 'Víctor')

    expect(campoNombre).toHaveValue('Víctor')
  })

  it('Al enviar vacío muestra los errores de los campos obligatorios', async () => {
    const usuario = userEvent.setup()
    render(<MemoryRouter><Registro /></MemoryRouter>)

    expect(screen.queryByText('El RUN es obligatorio.')).not.toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(screen.getByText('El RUN es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('El correo es obligatorio.')).toBeInTheDocument()
    expect(screen.getByText('Selecciona una región.')).toBeInTheDocument()
  })

  it('Las comunas dependen de la región seleccionada', async () => {
    const usuario = userEvent.setup()
    render(<MemoryRouter><Registro /></MemoryRouter>)

    const comunas = screen.getByLabelText(/^Comuna/)
    expect(comunas).toBeDisabled()

    await usuario.selectOptions(screen.getByLabelText(/^Región/), 'Biobío')

    expect(comunas).toBeEnabled()
    expect(screen.getByRole('option', { name: 'Concepción' })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'Ñuñoa' })).not.toBeInTheDocument()
  })

  /* [P3-1] DESCOMENTAR: borra esta línea y la que dice "FIN [P3-1]"
  // Llena todo el formulario con datos válidos
  async function llenarFormulario(usuario) {
    await usuario.type(screen.getByLabelText(/^RUN/), '123456785')
    await usuario.type(screen.getByLabelText(/^Nombre/), 'Camila')
    await usuario.type(screen.getByLabelText(/^Apellidos/), 'Rojas Díaz')
    await usuario.type(screen.getByLabelText(/^Correo electrónico/), 'camila.rojas@gmail.com')
    await usuario.type(screen.getByLabelText(/^Contraseña/), 'miClave1')
    await usuario.selectOptions(screen.getByLabelText(/^Región/), 'Biobío')
    await usuario.selectOptions(screen.getByLabelText(/^Comuna/), 'Concepción')
    await usuario.type(screen.getByLabelText(/^Dirección/), 'Av. Los Carrera 123')
  }

  it('Envía los datos a MS-Usuarios y muestra la bienvenida', async () => {
    registrar.mockResolvedValue({ usuario: { nombre: 'Camila', rol: 'INQUILINO' } })
    const usuario = userEvent.setup()
    render(<MemoryRouter><Registro /></MemoryRouter>)

    await llenarFormulario(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText(/Bienvenido\/a, Camila/)).toBeInTheDocument()
    expect(registrar).toHaveBeenCalledWith(
      expect.objectContaining({ run: '123456785', correo: 'camila.rojas@gmail.com', comuna: 'Concepción' }),
    )
  })

  it('Si el correo ya tiene cuenta (409), muestra el error bajo ese campo', async () => {
    registrar.mockRejectedValue({ response: { status: 409, data: { mensaje: 'El correo ya está registrado' } } })
    const usuario = userEvent.setup()
    render(<MemoryRouter><Registro /></MemoryRouter>)

    await llenarFormulario(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Crear cuenta' }))

    expect(await screen.findByText('Ya existe una cuenta con este correo.')).toBeInTheDocument()
  })
  FIN [P3-1] */
})
