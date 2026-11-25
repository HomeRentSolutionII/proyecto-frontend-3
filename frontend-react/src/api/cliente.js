// [P3-1] Archivo nuevo. No lo usa nadie hasta que descomentes los bloques [P3-1] de las páginas.
//
// Cliente HTTP (axios) para hablar con el backend. Todas las peticiones van al API Gateway,
// que revisa el token y las envía al microservicio que corresponde.
import axios from 'axios'
import {
  cerrarSesion,
  EVENTO_SESION_EXPIRADA,
  guardarTokens,
  obtenerTokenAcceso,
  obtenerTokenRenovacion,
} from './sesion'

// Dirección del Gateway. Se puede cambiar con la variable VITE_API_URL en un archivo .env
export const URL_API = import.meta.env.VITE_API_URL || 'http://localhost:8090'

const cliente = axios.create({ baseURL: URL_API, timeout: 15000 })

// 1) Antes de cada petición: si hay sesión, se agrega el token de acceso
cliente.interceptors.request.use((config) => {
  const token = obtenerTokenAcceso()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 2) Renovación del token. El de acceso dura 15 minutos: cuando vence, el Gateway responde 401.
//    Entonces se piden tokens nuevos con el de renovación (dura 7 días) y se repite la petición.
let renovacionEnCurso = null

function renovarTokens() {
  // Si varias peticiones fallan a la vez, todas esperan la misma renovación
  if (!renovacionEnCurso) {
    renovacionEnCurso = axios
      .post(`${URL_API}/api/v1/auth/refresh`, { tokenRenovacion: obtenerTokenRenovacion() })
      .then((respuesta) => guardarTokens(respuesta.data))
      .finally(() => {
        renovacionEnCurso = null
      })
  }
  return renovacionEnCurso
}

// En el login y el registro un 401 o 409 significa datos incorrectos, no un token vencido
function esRutaDeAcceso(url = '') {
  return ['/auth/login', '/auth/registro', '/auth/refresh'].some((ruta) => url.includes(ruta))
}

cliente.interceptors.response.use(
  (respuesta) => respuesta,
  async (error) => {
    const peticion = error.config
    const sePuedeRenovar =
      error.response?.status === 401 &&
      peticion &&
      !peticion.reintentada &&
      !esRutaDeAcceso(peticion.url) &&
      obtenerTokenRenovacion()

    if (!sePuedeRenovar) {
      return Promise.reject(error)
    }

    peticion.reintentada = true // se repite una sola vez
    try {
      await renovarTokens()
    } catch (errorRenovacion) {
      // El token de renovación también venció o ya no es válido: se cierra la sesión
      if (errorRenovacion.response) {
        cerrarSesion()
        window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA))
      }
      return Promise.reject(error)
    }
    return cliente(peticion)
  },
)

// Texto para mostrar al usuario cuando una petición falla
export function mensajeDeError(error, porDefecto = 'Ocurrió un error. Intenta nuevamente.') {
  if (!error.response) {
    return 'No se pudo conectar con el servidor. Revisa que el backend esté encendido.'
  }
  return error.response.data?.mensaje || error.response.data?.message || porDefecto
}

export default cliente
