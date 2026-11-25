// [P3-1] Archivo nuevo: pruebas de la sesión (api/sesion.js) y del cliente axios (api/cliente.js).
// No depende de descomentar nada; solo necesita que axios esté instalado.
import axios, { AxiosError } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import cliente, { mensajeDeError } from '../api/cliente'
import {
  cerrarSesion,
  EVENTO_SESION_EXPIRADA,
  guardarSesion,
  obtenerSesion,
  obtenerTokenAcceso,
} from '../api/sesion'

// Usuario tal como lo entrega MS-Usuarios
const USUARIO_BACKEND = { idUsuario: 7, nombre: 'Pedro', correo: 'pedro@duoc.cl', rol: 'INQUILINO' }

const adaptadorOriginal = cliente.defaults.adapter

// Simula al Gateway: en vez de enviar la petición por la red, responde lo que diga la función
function simularGateway(responder) {
  cliente.defaults.adapter = async (config) => {
    const { status, data } = responder(config)
    const respuesta = { status, data, statusText: '', headers: {}, config }
    if (status >= 400) {
      throw new AxiosError(`Error ${status}`, 'ERR_BAD_REQUEST', config, null, respuesta)
    }
    return respuesta
  }
}

afterEach(() => {
  cliente.defaults.adapter = adaptadorOriginal
  vi.restoreAllMocks()
})

describe('Sesión guardada en el navegador', () => {
  it('Guarda los tokens y el usuario, y traduce el rol al tipo que muestran las páginas', () => {
    const usuario = guardarSesion({ tokenAcceso: 'a1', tokenRenovacion: 'r1', usuario: USUARIO_BACKEND })

    expect(usuario).toMatchObject({ id: 7, nombre: 'Pedro', rol: 'INQUILINO', tipo: 'Inquilino' })
    expect(obtenerSesion()).toEqual(usuario)
    expect(obtenerTokenAcceso()).toBe('a1')
  })

  it('Al cerrar sesión se borran los tokens y el usuario', () => {
    guardarSesion({ tokenAcceso: 'a1', tokenRenovacion: 'r1', usuario: USUARIO_BACKEND })
    cerrarSesion()

    expect(obtenerSesion()).toBeNull()
    expect(obtenerTokenAcceso()).toBeNull()
  })
})

describe('Cliente axios', () => {
  it('Agrega el token de acceso en la cabecera Authorization', async () => {
    guardarSesion({ tokenAcceso: 'a1', tokenRenovacion: 'r1', usuario: USUARIO_BACKEND })
    let cabecera = null
    simularGateway((config) => {
      cabecera = config.headers.Authorization
      return { status: 200, data: [] }
    })

    await cliente.get('/api/v1/reservas')

    expect(cabecera).toBe('Bearer a1')
  })

  it('Si el token venció (401), lo renueva y repite la petición', async () => {
    guardarSesion({ tokenAcceso: 'vencido', tokenRenovacion: 'r1', usuario: USUARIO_BACKEND })
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { tokenAcceso: 'nuevo', tokenRenovacion: 'r2' } })
    simularGateway((config) =>
      config.headers.Authorization === 'Bearer nuevo' ? { status: 200, data: 'ok' } : { status: 401, data: {} },
    )

    const respuesta = await cliente.get('/api/v1/reservas')

    expect(respuesta.data).toBe('ok')
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/api/v1/auth/refresh'), { tokenRenovacion: 'r1' })
    expect(obtenerTokenAcceso()).toBe('nuevo')
  })

  it('Si tampoco se puede renovar, cierra la sesión y avisa a la aplicación', async () => {
    guardarSesion({ tokenAcceso: 'vencido', tokenRenovacion: 'vencido', usuario: USUARIO_BACKEND })
    vi.spyOn(axios, 'post').mockRejectedValue({ response: { status: 401 } })
    simularGateway(() => ({ status: 401, data: {} }))
    const alExpirar = vi.fn()
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar)

    await expect(cliente.get('/api/v1/reservas')).rejects.toMatchObject({ response: { status: 401 } })

    expect(obtenerSesion()).toBeNull()
    expect(alExpirar).toHaveBeenCalledTimes(1)
    window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar)
  })

  it('Un 401 del login no intenta renovar: son credenciales incorrectas', async () => {
    guardarSesion({ tokenAcceso: 'a1', tokenRenovacion: 'r1', usuario: USUARIO_BACKEND })
    vi.spyOn(axios, 'post')
    simularGateway(() => ({ status: 401, data: { mensaje: 'Correo o contraseña incorrectos' } }))

    await expect(cliente.post('/api/v1/auth/login', {})).rejects.toMatchObject({ response: { status: 401 } })

    expect(axios.post).not.toHaveBeenCalled()
    expect(obtenerSesion()).not.toBeNull()
  })
})

describe('Mensajes de error', () => {
  it('Usa el mensaje del backend o avisa que no hay conexión', () => {
    expect(mensajeDeError({ response: { status: 409, data: { mensaje: 'El RUN ya está registrado' } } }))
      .toBe('El RUN ya está registrado')
    expect(mensajeDeError(new Error('Network Error'))).toMatch(/No se pudo conectar con el servidor/)
  })
})
