import { describe, expect, it } from 'vitest'
import { filtrarPropiedades } from '../data/propiedades'
import {
  agregarReserva,
  calcularTotales,
  obtenerReservas,
  quitarReserva,
  quitarReservas,
} from '../data/reservas'
import { esAdmin, puedeReservar, puedeVerPanel, tieneRol } from '../utils/permisos'
import { ADMIN, ANFITRION, INQUILINO, PROPIEDADES } from './datosPrueba'

// setup.js borra localStorage después de cada prueba, así cada una parte con el carrito vacío.

describe('Filtros del catálogo', () => {
  it('Filtra por texto, tipo y rango de precio', () => {
    expect(filtrarPropiedades(PROPIEDADES, { tipo: 'Cabaña' })).toHaveLength(4)
    expect(filtrarPropiedades(PROPIEDADES, { texto: 'santiago' })).toHaveLength(3)
    expect(filtrarPropiedades(PROPIEDADES, { precioMin: '80000', precioMax: '100000' })).toHaveLength(5)
  })
})

describe('Carrito de estadías', () => {
  it('Agrega y quita estadías, y suma subtotal y total', () => {
    agregarReserva({ nombre: 'Loft', subtotal: 108000, total: 162000 })
    const lista = agregarReserva({ nombre: 'Cabaña', subtotal: 100000, total: 80000 })
    expect(obtenerReservas()).toHaveLength(2)
    expect(calcularTotales(lista)).toEqual({ subtotal: 208000, total: 242000 })

    quitarReserva(lista[0].id)
    expect(obtenerReservas()).toHaveLength(1)
  })

  it('Quita de una vez las estadías que ya se confirmaron', () => {
    agregarReserva({ nombre: 'A', subtotal: 1, total: 1 })
    agregarReserva({ nombre: 'B', subtotal: 1, total: 1 })
    const ids = obtenerReservas().map((reserva) => reserva.id)
    expect(quitarReservas(ids)).toEqual([])
  })
})

describe('Permisos por rol', () => {
  it('Cada rol puede hacer solo lo suyo', () => {
    expect(esAdmin(ADMIN)).toBe(true)
    expect(esAdmin(ANFITRION)).toBe(false)
    expect(puedeVerPanel(ANFITRION)).toBe(true)
    expect(puedeVerPanel(INQUILINO)).toBe(false)
    expect(puedeReservar(INQUILINO)).toBe(true)
    expect(puedeReservar(null)).toBe(true) // el visitante arma su carrito y luego inicia sesión
    expect(puedeReservar(ADMIN)).toBe(false)
    expect(tieneRol(null, 'ADMIN')).toBe(false)
  })
})
