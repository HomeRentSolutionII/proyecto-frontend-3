import { useState } from 'react' // [P3-1] BORRAR esta línea
/* [P3-1] DESCOMENTAR: borra esta línea y la que dice "FIN [P3-1]"
import { useEffect, useState } from 'react'
FIN [P3-1] */
import { Route, Routes } from 'react-router-dom'
import Encabezado from './components/Encabezado'
import PiePagina from './components/PiePagina'
import { agregarReserva, obtenerReservas, quitarReserva, vaciarReservas } from './data/reservas'
import { cerrarSesion, guardarSesion, obtenerSesion } from './data/usuarios' // [P3-1] BORRAR esta línea
/* [P3-1] DESCOMENTAR: borra esta línea y la que dice "FIN [P3-1]"
import { obtenerUsuarioActual } from './api/auth'
import {
  actualizarUsuarioSesion,
  cerrarSesion,
  EVENTO_SESION_EXPIRADA,
  guardarSesion,
  obtenerSesion,
} from './api/sesion'
FIN [P3-1] */
import AdminInicio from './pages/admin/AdminInicio'
import AdminLayout from './pages/admin/AdminLayout'
import AdminPropiedades from './pages/admin/AdminPropiedades'
import AdminUsuarios from './pages/admin/AdminUsuarios'
import FormularioPropiedad from './pages/admin/FormularioPropiedad'
import FormularioUsuario from './pages/admin/FormularioUsuario'
import DetallePropiedad from './pages/DetallePropiedad'
import Blog from './pages/Blog'
import Contacto from './pages/Contacto'
import DetalleBlog from './pages/DetalleBlog'
import Inicio from './pages/Inicio'
import Login from './pages/Login'
import NoEncontrada from './pages/NoEncontrada'
import Nosotros from './pages/Nosotros'
import Propiedades from './pages/Propiedades'
import Registro from './pages/Registro'
import Reservas from './pages/Reservas'

function App() {
  // Estado compartido por varias páginas. Vive aquí y baja por props.
  const [reservas, setReservas] = useState(() => obtenerReservas())
  const [usuario, setUsuario] = useState(() => obtenerSesion())

  /* [P3-1] DESCOMENTAR: borra esta línea y la que dice "FIN [P3-1]"
  // Si el token vence y no se puede renovar, cliente.js avisa con este evento y se cierra la sesión
  useEffect(() => {
    function alExpirarSesion() {
      setUsuario(null)
    }
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirarSesion)
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirarSesion)
  }, [])

  // Al abrir la página con una sesión guardada, se confirma con el backend que sigue válida
  useEffect(() => {
    if (!obtenerSesion()) return
    obtenerUsuarioActual()
      .then((datos) => {
        if (obtenerSesion()) setUsuario(actualizarUsuarioSesion(datos))
      })
      .catch(() => {}) // si el token ya no sirve, cliente.js ya cerró la sesión
  }, [])
  FIN [P3-1] */

  function manejarAgregarReserva(reserva) {
    setReservas(agregarReserva(reserva))
  }

  function manejarQuitarReserva(id) {
    setReservas(quitarReserva(id))
  }

  function manejarConfirmarReservas() {
    setReservas(vaciarReservas())
  }

  function manejarIniciarSesion(datosUsuario) {
    setUsuario(guardarSesion(datosUsuario))
  }

  function manejarCerrarSesion() {
    cerrarSesion()
    setUsuario(null)
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      <Encabezado
        cantidadReservas={reservas.length}
        usuario={usuario}
        onCerrarSesion={manejarCerrarSesion}
      />

      <main className="flex-grow-1">
        <Routes>
          {/* ===== Víctor ===== */}
          <Route path="/" element={<Inicio />} />
          <Route path="/propiedades" element={<Propiedades />} />
          <Route
            path="/propiedades/:id"
            element={<DetallePropiedad onAgregarReserva={manejarAgregarReserva} />}
          />
          <Route
            path="/reservas"
            element={
              <Reservas
                reservas={reservas}
                usuario={usuario}
                onQuitar={manejarQuitarReserva}
                onConfirmar={manejarConfirmarReservas}
              />
            }
          />
          <Route path="/registro" element={<Registro />} />
          <Route
            path="/login"
            element={
              <Login usuario={usuario} onIniciarSesion={manejarIniciarSesion} onCerrarSesion={manejarCerrarSesion} />
            }
          />

          {/* ===== Jhohan ===== */}
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<DetalleBlog />} />
          <Route path="/contacto" element={<Contacto />} />

          {/* ===== Panel de administración: rutas anidadas dentro de AdminLayout ===== */}
          <Route path="/admin" element={<AdminLayout usuario={usuario} />}>
            <Route index element={<AdminInicio />} />
            <Route path="propiedades" element={<AdminPropiedades />} />
            <Route path="propiedades/nueva" element={<FormularioPropiedad key="nueva" />} />
            <Route path="propiedades/:id/editar" element={<FormularioPropiedad key="editar" />} />
            <Route path="usuarios" element={<AdminUsuarios usuarioActual={usuario} />} />
            <Route path="usuarios/nuevo" element={<FormularioUsuario key="nuevo" />} />
            <Route path="usuarios/:id/editar" element={<FormularioUsuario key="editar" />} />
          </Route>

          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </main>

      <PiePagina />
    </div>
  )
}

export default App
