import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listarPropiedades } from '../api/propiedades'
import Propiedades from '../pages/Propiedades'
import { PROPIEDADES } from './datosPrueba'

// MS-Propiedades simulado: cada función del módulo se reemplaza por una vi.fn()
vi.mock('../api/propiedades')

function renderizar() {
  render(
    <MemoryRouter>
      <Propiedades />
    </MemoryRouter>,
  )
}

describe('Página Propiedades', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listarPropiedades.mockResolvedValue(PROPIEDADES)
  })

  it('Pide el catálogo al backend y dibuja una tarjeta por cada propiedad', async () => {
    renderizar()
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
    expect(await screen.findAllByRole('button', { name: 'Ver detalle' })).toHaveLength(20)
    expect(listarPropiedades).toHaveBeenCalled()
  })

  it('Al elegir un tipo, muestra solo las propiedades de ese tipo', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await screen.findAllByRole('button', { name: 'Ver detalle' })

    await usuario.selectOptions(screen.getByLabelText('Tipo de propiedad'), 'Cabaña')

    expect(screen.getAllByRole('button', { name: 'Ver detalle' })).toHaveLength(4)
    expect(screen.getByText('Cabaña frente al lago')).toBeInTheDocument()
    expect(screen.queryByText('Loft céntrico para profesionales')).not.toBeInTheDocument()
  })

  it('Muestra un aviso cuando ninguna propiedad coincide, y Limpiar filtros las recupera', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await screen.findAllByRole('button', { name: 'Ver detalle' })

    await usuario.type(screen.getByLabelText('Ubicación o nombre'), 'Antártica')
    expect(screen.getByText(/No hay propiedades/)).toBeInTheDocument()

    await usuario.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(screen.getAllByRole('button', { name: 'Ver detalle' })).toHaveLength(20)
  })

  it('Si el backend no responde, muestra el aviso de conexión', async () => {
    listarPropiedades.mockRejectedValue(new Error('Network Error'))
    renderizar()
    expect(await screen.findByText(/No se pudo conectar con el servidor/)).toBeInTheDocument()
  })
})
