// Ayudas para trabajar con la lista de propiedades que entrega MS-Propiedades
// (las llamadas al backend están en src/api/propiedades.js).

export const TIPOS_PROPIEDAD = ['Departamento', 'Casa', 'Cabaña', 'Loft', 'Parcela']

// ===== FILTROS =====
// No modifica los datos: recibe una lista y devuelve solo las que cumplen.
export function filtrarPropiedades(lista, filtros) {
  const texto = (filtros.texto || '').trim().toLowerCase()
  const minimo = Number(filtros.precioMin) || 0
  const maximo = Number(filtros.precioMax) || Infinity

  return lista.filter((propiedad) => {
    const coincideTexto =
      propiedad.nombre.toLowerCase().includes(texto) ||
      propiedad.ubicacion.toLowerCase().includes(texto)
    const coincideTipo = !filtros.tipo || propiedad.tipo === filtros.tipo
    const coincidePrecio = propiedad.precio >= minimo && propiedad.precio <= maximo
    return coincideTexto && coincideTipo && coincidePrecio
  })
}
