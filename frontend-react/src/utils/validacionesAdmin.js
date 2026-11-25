// Reglas de los formularios del panel de administración.
// Cada función revisa un formulario completo y devuelve un objeto
// solo con los campos que tienen error (vacío si todo está bien).
import { validarClave, validarCorreo, validarRun, validarTexto } from './validaciones'

function soloConErrores(errores) {
  return Object.fromEntries(Object.entries(errores).filter(([, mensaje]) => mensaje))
}

function validarNumero(valor, etiqueta, minimo) {
  if (valor === '') return `Ingresa ${etiqueta}.`
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero < minimo) {
    return `Debe ser un número entero de ${minimo} o más.`
  }
  return ''
}

export function validarPropiedad(datos) {
  return soloConErrores({
    nombre: validarTexto(datos.nombre, 'El nombre', 100),
    tipo: datos.tipo ? '' : 'Selecciona un tipo de propiedad.',
    ubicacion: validarTexto(datos.ubicacion, 'La ubicación', 100),
    precio: validarNumero(datos.precio, 'el precio', 1000),
    capacidad: validarNumero(datos.capacidad, 'la capacidad', 1),
    habitaciones: validarNumero(datos.habitaciones, 'las habitaciones', 1),
    banos: validarNumero(datos.banos, 'los baños', 1),
    superficie: validarNumero(datos.superficie, 'la superficie', 1),
    descripcion: validarTexto(datos.descripcion, 'La descripción', 500),
  })
}

// Al editar, la contraseña es opcional: si se deja vacía se mantiene la actual
export function validarUsuarioAdmin(datos, esEdicion) {
  const cambiaClave = !esEdicion || datos.clave !== ''
  return soloConErrores({
    run: validarRun(datos.run),
    nombre: validarTexto(datos.nombre, 'El nombre', 50),
    apellidos: validarTexto(datos.apellidos, 'Los apellidos', 100),
    correo: validarCorreo(datos.correo),
    tipo: datos.tipo ? '' : 'Selecciona un tipo de usuario.',
    clave: cambiaClave ? validarClave(datos.clave) : '',
    confirmarClave: cambiaClave && datos.clave !== datos.confirmarClave ? 'Las contraseñas no coinciden.' : '',
  })
}
