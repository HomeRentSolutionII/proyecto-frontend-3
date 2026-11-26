# Home Rent Solution — Frontend en React

Proyecto de DSY1104 Desarrollo Full Stack II, Evaluación Parcial 3.
Stack: **React + Vite**, **React Router**, **React Bootstrap**, **axios** y pruebas con **Vitest**.

Los datos vienen del backend de microservicios en Spring Boot: todas las peticiones van al
**API Gateway** (`http://localhost:8090`), que revisa el token JWT y las envía al microservicio que corresponde.

## Cómo levantarlo con el backend

1. Levantar el backend (ver el README del repo `infraestructura`): Eureka, los microservicios y al final el Gateway.
2. En esta carpeta: `npm install` (la primera vez) y `npm run dev`.
3. Abrir **http://localhost:5173**. Tiene que ser ese puerto: el Gateway solo acepta peticiones (CORS) desde ahí.

Para usar otro Gateway, crear un archivo `.env.local` con `VITE_API_URL=http://otra-direccion:puerto`.

## Comandos

Requiere Node.js 22.13 o superior.

| Comando | Qué hace |
|---|---|
| `npm install` | Instala las dependencias (solo la primera vez o si cambia `package.json`) |
| `npm run dev` | Levanta la app en `http://localhost:5173` |
| `npm test` | Corre las pruebas y las vuelve a correr al guardar cambios |
| `npm run coverage` | Corre las pruebas una vez y genera el informe de cobertura en `coverage/index.html` |
| `npm run lint` | Revisa errores de código con ESLint |

## Estructura

```
src/
├── main.jsx               Punto de entrada: carga Bootstrap, estilos y el router
├── App.jsx                Rutas de todas las páginas, permisos por rol y estado compartido (carrito, sesión)
├── index.css              Colores y estilos propios (la grilla la pone Bootstrap)
├── api/                   Conexión con el backend (axios), un archivo por microservicio
│   ├── cliente.js         axios apuntando al Gateway: agrega el token y lo renueva cuando vence
│   ├── sesion.js          Tokens y usuario guardados en localStorage (sesión persistente)
│   ├── auth.js            MS-Usuarios: login, registro y /me
│   ├── usuarios.js        MS-Usuarios: CRUD del panel (solo administrador)
│   ├── propiedades.js     MS-Propiedades (y sus reglas de precio en MS-Precios al crear)
│   ├── precios.js         MS-Precios: precio de una estadía según la temporada
│   ├── reservas.js        MS-Reservas: crear, listar y ver el detalle
│   ├── contacto.js        MS-Mensajería: formulario de contacto
│   └── anfitriones.js     MS-Anfitriones: lista para el formulario de propiedades
├── assets/js/
│   └── propiedades.json   Las 20 propiedades de ejemplo (las mismas que carga MS-Propiedades); las usan las pruebas
├── data/
│   ├── propiedades.js     Tipos de propiedad y filtros del catálogo
│   ├── usuarios.js        Tipos de usuario y administrador de prueba
│   ├── reservas.js        Carrito: estadías elegidas que falta confirmar (localStorage)
│   └── regiones.js        Regiones y comunas de Chile
├── utils/
│   ├── permisos.js        Qué puede hacer cada rol en el frontend
│   ├── validaciones.js    RUN, correo, contraseña, fechas...
│   └── formato.js         Precios ($68.000), fechas y noches
├── components/            Piezas reutilizables (encabezado, pie, tarjeta, RutaProtegida, EstadoCarga...)
├── pages/                 Una página por archivo
│   └── admin/             Panel: administrador (todo) y anfitrión (solo ver propiedades y reservas)
└── test/                  Pruebas con Vitest; simulan el backend con vi.mock (datosPrueba.js tiene los datos)

public/img/                Imágenes de las propiedades y del banner
```

## Quién hace qué

| Integrante | Páginas | Ruta |
|---|---|---|
| Víctor | Inicio, Propiedades, Detalle, Mis reservas, Registro, Login | `/`, `/propiedades`, `/propiedades/:id`, `/reservas`, `/registro`, `/login` |
| Jhohan | Nosotros, Blog, Detalle blog, Contacto | `/nosotros`, `/blog`, `/blog/:id`, `/contacto` |
| Noemí | Panel de administración | `/admin`, `/admin/propiedades`, `/admin/propiedades/nueva`, `/admin/propiedades/:id/editar`, `/admin/reservas`, `/admin/reservas/:id`, `/admin/usuarios`, `/admin/usuarios/nuevo`, `/admin/usuarios/:id/editar`, `/admin/mensajes` |

## Qué ve cada rol

El frontend oculta pantallas y botones según el rol (`src/utils/permisos.js` y `components/RutaProtegida.jsx`).
Además, el Gateway vuelve a revisar el rol del token en cada petición, así que saltarse el frontend no sirve.

| Rol | Puede |
|---|---|
| Visitante | Ver el catálogo, armar el carrito, registrarse y escribir por Contacto |
| Inquilino | Lo anterior, y confirmar reservas y ver sus reservas en Mis reservas |
| Anfitrión | Panel de solo lectura: propiedades (lista y detalle) y reservas (lista y detalle) |
| Administrador | Todo el panel: resumen, propiedades, reservas, usuarios y mensajes de contacto |

## Cómo agregar tu página

1. Crea el archivo en `src/pages/`, por ejemplo `src/pages/Nosotros.jsx`:

   ```jsx
   import { Container } from 'react-bootstrap'

   function Nosotros() {
     return (
       <Container as="section" className="py-5">
         <h1 className="titulo">Nosotros</h1>
         ...
       </Container>
     )
   }

   export default Nosotros
   ```

2. En `App.jsx`, impórtala y agrega su ruta:

   ```jsx
   import Nosotros from './pages/Nosotros'
   ...
   <Route path="/nosotros" element={<Nosotros />} />
   ```

3. Para los datos usa las funciones de `src/api/` (son asíncronas: van al backend), por ejemplo:

   ```jsx
   import { listarPropiedades, eliminarPropiedad } from '../api/propiedades'
   ```

4. Escribe las pruebas de tu página en `src/test/`, con el nombre `TuPagina.test.jsx`.

## Guía visual

Para que todas las páginas se vean iguales, **partan copiando una página existente** y cambien solo el contenido:
formularios → `Login.jsx` / `Registro.jsx`, tablas → `Reservas.jsx`, listados con tarjetas → `Propiedades.jsx`.

| Elemento | Cómo se hace |
|---|---|
| Página | `<Container as="section" className="py-5">` |
| Título de la página | `<h1 className="titulo">` (lleva la línea verde) |
| Botón principal | `<Button variant="primary">` (sale verde) |
| Botón secundario | `<Button variant="outline-dark">` |
| Botón eliminar | `<Button variant="outline-danger">` |
| Formulario | Dentro de `<Card className="caja-formulario mx-auto shadow-sm">`, con `CampoFormulario` por campo |
| Tabla | `<Table responsive hover>` |
| Mensajes | `<Alert variant="success">`, `"danger"` o `"info"` |
| Columnas | `<Row>` y `<Col md={6}>`, `<Col lg={4}>`... para que sea responsivo |

**Qué evitar:**
- Las clases de la Parcial 1 (`boton`, `tarjeta-cuerpo`, `contenedor`...): ya no existen y quedan sin estilo.
- Otros colores de Bootstrap en botones (`success`, `warning`, `info`) o colores escritos a mano. Si hace falta un color, usar `var(--azul)` o `var(--verde)`.
- `getElementById` para leer formularios: en React los valores van en `useState`.

## Reglas del equipo

- **El menú y el pie no se copian en cada página**: ya están en `App.jsx` y se muestran en todas.
- **Para maquetar usa Bootstrap** (`Container`, `Row`, `Col`, `Card`, `Form`, `Table`, `Button`) así el sitio queda responsivo y parejo. Solo agrega CSS en `index.css` si Bootstrap no lo resuelve, y avisa al equipo.
- **Los enlaces internos van con `<Link to="/ruta">`** de React Router, no con `<a href>`; así la página no se recarga.
- **No edites archivos de otro integrante** sin avisarle. Lo compartido (`App.jsx`, `data/`, `index.css`) se conversa antes.
- **Antes de subir cambios**, corre `npm test` y `npm run lint` y revisa que no haya errores.

## Usuarios de prueba

MS-Usuarios crea al arrancar un usuario por rol (administrador, anfitrión e inquilino); cuáles son está en el
README de MS-Usuarios. El botón *Usar cuenta de administrador de prueba* del login rellena el del administrador.
El administrador y el anfitrión entran a `/admin`; el inquilino, a la tienda.

Los datos viven en las bases de datos de cada microservicio. En el navegador (`localStorage`) solo quedan
la sesión (`hrs_sesion`, `hrs_tokens`) y el carrito (`hrs_carrito`).
prueba de control
