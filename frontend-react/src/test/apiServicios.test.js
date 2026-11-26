// Pruebas de los módulos de src/api que hablan con cada microservicio: revisan que se llame
// a la ruta correcta y que los datos se traduzcan bien entre el backend y las páginas.
// En vez de la red se usa un "Gateway simulado" que responde lo que se le indica.
import { AxiosError } from 'axios'
import { afterEach, describe, expect, it } from 'vitest'
import cliente from '../api/cliente'
import { calcularPrecio } from '../api/precios'
import { crearPropiedad, desdeBackend, listarPropiedades, obtenerPropiedad } from '../api/propiedades'
import { crearReserva, listarReservas } from '../api/reservas'
import { crearUsuario } from '../api/usuarios'

const adaptadorOriginal = cliente.defaults.adapter
let peticiones = [] // lo que la página le envió al Gateway

// responder(config) devuelve { status, data } según el método y la ruta pedidos
function simularGateway(responder) {
  peticiones = []
  cliente.defaults.adapter = async (config) => {
    const datos = config.data ? JSON.parse(config.data) : undefined
    peticiones.push({ metodo: config.method.toUpperCase(), url: config.url, datos })
    const { status = 200, data } = responder(config, datos)
    const respuesta = { status, data, statusText: '', headers: {}, config }
    if (status >= 400) throw new AxiosError(`Error ${status}`, 'ERR_BAD_REQUEST', config, null, respuesta)
    return respuesta
  }
}

afterEach(() => {
  cliente.defaults.adapter = adaptadorOriginal
})

const CABANA_BACKEND = {
  id: 3, titulo: 'Cabaña de montaña con tinaja', descripcion: 'Cabaña de madera.', ubicacion: 'Pucón, La Araucanía',
  precio: 75000.0, idAnfitrion: 1, tipo: 'cabana', disponible: true, imagen: '/img/img-tarjeta-3.avif',
  capacidad: 4, habitaciones: 2, banos: 1, superficie: 55, servicios: ['Tinaja'], destacada: true,
}

describe('MS-Propiedades', () => {
  it('Traduce los nombres del backend a los de las páginas (titulo → nombre, cabana → Cabaña)', () => {
    expect(desdeBackend(CABANA_BACKEND)).toMatchObject({
      id: 3, nombre: 'Cabaña de montaña con tinaja', tipo: 'Cabaña', precio: 75000, alt: 'Cabaña de montaña con tinaja',
    })
  })

  it('Lista el catálogo y devuelve null si una propiedad no existe', async () => {
    simularGateway((config) =>
      config.url === '/api/v1/propiedades' ? { data: [CABANA_BACKEND] } : { status: 404, data: {} },
    )
    expect(await listarPropiedades()).toHaveLength(1)
    expect(await obtenerPropiedad(999)).toBeNull()
  })

  it('Al crear una propiedad también crea sus 3 reglas de precio y la deja disponible', async () => {
    simularGateway((config, datos) => {
      if (config.url === '/api/v1/propiedades') return { status: 201, data: { ...CABANA_BACKEND, ...datos, id: 21, disponible: false } }
      if (config.url === '/api/v1/precios') return { status: 201, data: datos }
      return { data: { ...CABANA_BACKEND, id: 21, disponible: true } } // PUT /21/estado
    })

    const creada = await crearPropiedad({ nombre: 'Casa nueva', tipo: 'Casa', idAnfitrion: 2, precio: 50000 })

    expect(peticiones[0]).toMatchObject({ metodo: 'POST', datos: { titulo: 'Casa nueva', tipo: 'casa', idAnfitrion: 2 } })
    const reglas = peticiones.filter((peticion) => peticion.url === '/api/v1/precios')
    expect(reglas.map((regla) => regla.datos.temporada)).toEqual(['Alta', 'Media', 'Baja'])
    expect(reglas.every((regla) => regla.datos.idPropiedad === 21)).toBe(true)
    expect(peticiones.at(-1)).toMatchObject({ metodo: 'PUT', url: '/api/v1/propiedades/21/estado' })
    expect(creada.disponible).toBe(true)
  })
})

describe('MS-Precios y MS-Reservas', () => {
  it('Calcula el precio de una estadía con /calcular', async () => {
    simularGateway(() => ({
      data: { temporada: 'Alta', multiplicador: 1.5, cantidadNoches: 3, subtotalBase: 225000.0, totalFinal: 337500.0 },
    }))

    const precio = await calcularPrecio(3, '2026-12-20', '2026-12-23')

    expect(peticiones[0]).toMatchObject({
      metodo: 'POST', url: '/api/v1/precios/calcular',
      datos: { idPropiedad: 3, fechaEntrada: '2026-12-20', fechaSalida: '2026-12-23' },
    })
    expect(precio).toEqual({ temporada: 'Alta', multiplicador: 1.5, noches: 3, subtotal: 225000, total: 337500 })
  })

  it('Crea una reserva sin enviar el idInquilino (lo pone MS-Reservas según la sesión)', async () => {
    simularGateway(() => ({
      status: 201,
      data: { idReserva: 4, idPropiedad: 3, idInquilino: 1, estado: 'PENDIENTE', fechaInicio: '2026-12-20T00:00:00',
        fechaFin: '2026-12-23T00:00:00', montoTotal: 337500.0 },
    }))

    const reserva = await crearReserva({ propiedadId: 3, llegada: '2026-12-20', salida: '2026-12-23' })

    expect(peticiones[0].datos).toEqual({ idPropiedad: 3, fechaInicio: '2026-12-20', fechaFin: '2026-12-23' })
    expect(reserva).toMatchObject({ id: 4, estado: 'PENDIENTE', llegada: '2026-12-20', salida: '2026-12-23', montoTotal: 337500 })
  })

  it('Lista las reservas de la más nueva a la más antigua', async () => {
    simularGateway(() => ({
      data: [
        { idReserva: 1, estadoReserva: 'PENDIENTE', fechaInicio: '2027-07-01T00:00:00', fechaFin: '2027-07-03T00:00:00' },
        { idReserva: 2, estadoReserva: 'CONFIRMADA', fechaInicio: '2026-12-21T00:00:00', fechaFin: '2026-12-24T00:00:00' },
      ],
    }))
    expect((await listarReservas()).map((reserva) => reserva.id)).toEqual([2, 1])
  })
})

describe('MS-Usuarios', () => {
  it('Envía el tipo elegido como rol del backend', async () => {
    simularGateway((config, datos) => ({ status: 201, data: { ...datos, idUsuario: 9 } }))

    const creado = await crearUsuario({ run: '21456789K', nombre: 'Ana', apellidos: 'Soto', correo: 'ana@gmail.com',
      clave: 'clave1', tipo: 'Anfitrión' })

    expect(peticiones[0].datos).toMatchObject({ rol: 'ANFITRION', clave: 'clave1', direccion: null })
    expect(creado).toMatchObject({ id: 9, rol: 'ANFITRION', tipo: 'Anfitrión' })
  })
})
