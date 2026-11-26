import { useEffect, useState } from 'react'

import { Navigate, Route, Routes } from 'react-router-dom'
import Encabezado from './components/Encabezado'
import PiePagina from './components/PiePagina'
import RutaProtegida from './components/RutaProtegida'
import { agregarReserva, obtenerReservas, quitarReserva, quitarReservas } from './data/reservas'

import { obtenerUsuarioActual } from './api/auth'
import {
  actualizarUsuarioSesion,
  cerrarSesion,
  EVENTO_SESION_EXPIRADA,
  guardarSesion,
  obtenerSesion,
} from './api/sesion'

import AdminInicio from './pages/admin/AdminInicio'
import AdminLayout from './pages/admin/AdminLayout'
import AdminMensajes from './pages/admin/AdminMensajes'
import AdminPropiedades from './pages/admin/AdminPropiedades'
import AdminReservas from './pages/admin/AdminReservas'
import AdminUsuarios from './pages/admin/AdminUsuarios'
import DetalleReserva from './pages/admin/DetalleReserva'
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
import { esAdmin, puedeReservar } from './utils/permisos'

function App() {
  // Estado compartido por varias páginas. Vive aquí y baja por props.
  const [reservas, setReservas] = useState(() => obtenerReservas())
  const [usuario, setUsuario] = useState(() => obtenerSesion())


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


  function manejarAgregarReserva(reserva) {
    setReservas(agregarReserva(reserva))
  }

  function manejarQuitarReserva(id) {
    setReservas(quitarReserva(id))
  }

  // Recibe los ids de las estadías que MS-Reservas aceptó y las saca del carrito
  function manejarConfirmarReservas(ids) {
    setReservas(quitarReservas(ids))
  }

  function manejarIniciarSesion(datosUsuario) {
    setUsuario(guardarSesion(datosUsuario))
  }

  function manejarCerrarSesion() {
    cerrarSesion()
    setUsuario(null)
  }

  // Envuelve una página del panel que solo puede ver el administrador
  function soloAdmin(pagina) {
    return <RutaProtegida usuario={usuario} roles={['ADMIN']}>{pagina}</RutaProtegida>
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
            element={<DetallePropiedad usuario={usuario} onAgregarReserva={manejarAgregarReserva} />}
          />
          {/* Mis reservas: visitantes e inquilinos. El administrador y el anfitrión no reservan. */}
          <Route
            path="/reservas"
            element={
              puedeReservar(usuario) ? (
                <Reservas
                  reservas={reservas}
                  usuario={usuario}
                  onQuitar={manejarQuitarReserva}
                  onConfirmar={manejarConfirmarReservas}
                />
              ) : (
                <RutaProtegida usuario={usuario} roles={['INQUILINO']} />
              )
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

          {/* ===== Panel: rutas anidadas dentro de AdminLayout =====
              Entran el administrador y el anfitrión. El anfitrión solo ve propiedades y reservas;
              el resto está envuelto en soloAdmin(...). */}
          <Route path="/admin" element={<AdminLayout usuario={usuario} />}>
            <Route index element={esAdmin(usuario) ? <AdminInicio /> : <Navigate to="propiedades" replace />} />
            <Route path="propiedades" element={<AdminPropiedades usuario={usuario} />} />
            <Route path="propiedades/nueva" element={soloAdmin(<FormularioPropiedad key="nueva" />)} />
            <Route path="propiedades/:id/editar" element={soloAdmin(<FormularioPropiedad key="editar" />)} />
            <Route path="reservas" element={<AdminReservas />} />
            <Route path="reservas/:id" element={<DetalleReserva />} />
            <Route path="usuarios" element={soloAdmin(<AdminUsuarios usuarioActual={usuario} />)} />
            <Route path="usuarios/nuevo" element={soloAdmin(<FormularioUsuario key="nuevo" />)} />
            <Route path="usuarios/:id/editar" element={soloAdmin(<FormularioUsuario key="editar" />)} />
            <Route path="mensajes" element={soloAdmin(<AdminMensajes />)} />
          </Route>

          <Route path="*" element={<NoEncontrada />} />
        </Routes>
      </main>

      <PiePagina />
    </div>
  )
}

export default App
