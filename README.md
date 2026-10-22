# IngeNotes · Banco estudiantil de recursos académicos (frontend)

Plataforma web para que los estudiantes de la Facultad de Ingeniería compartan recursos (PDF, imágenes y enlaces) por carrera y materia, los valoren y sigan a sus compañeros favoritos.

**Stack:** React 18 + Vite + TypeScript + Tailwind CSS + React Router 6 + lucide-react. Sin backend todavía: datos mock en `src/mocks/` detrás de una capa de servicios en `src/services/`.

## Instalar y ejecutar

Requisitos: Node.js 18 o superior (probado con Node 22).

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # verificación de tipos + build de producción en dist/
npm run preview    # sirve el build
```

Cuenta de prueba: `laura.gomez@unicampus.edu.co` / `Demo1234` (todas las cuentas mock usan la misma contraseña; la pantalla de login tiene un botón "Usar estos datos").


## Arquitectura

```
src/
  components/   UI reutilizable: Button, Input, Textarea, Select, Modal, Drawer, Tabs, Chip,
                Avatar, PostCard, FileDropzone, Toast, EmptyState, Skeleton, ConfirmDialog,
                Menu, StarRating, Logo, PageLoader
  context/      AuthContext (sesión), DataSyncContext (invalidación), CatalogContext
                (carreras/materias), FavoritesContext (usuarios favoritos)
  features/     auth (guardas de ruta), feed (filtros en la URL, búsqueda, sidebar),
                posts (lista paginada, formulario, eliminación), forum (pestaña Foro, preguntas),
                account (pestañas de Mi cuenta)
  hooks/        useDebounce, useMediaQuery, useDialogBehavior (foco/Esc/inert), useLocalStorageState
  layouts/      AppLayout (header + sidebar + aside), AuthLayout, Header, RightAside
  mocks/        carreras, usuarios, publicaciones, "base de datos" en memoria + localStorage
  pages/        Login, Registro, Recuperar, Home (feed), Account, PostForm, Thread (hilo del foro), NotFound
  services/     authService, catalogService, postService, forumService, userService, apiClient
  styles/       tokens.css (paleta como variables CSS, consumidas por tailwind.config.js)
  types/        User, Career, Subject, Post, Attachment, etc.
  utils/        formato (fechas relativas, tamaños), validación, texto
```

- **Capa de datos:** los componentes solo importan de `@/services`. Cada función es `async` y devuelve los mismos DTO que entregará Spring Boot. Hoy leen `src/mocks/db.ts`; mañana se cambian por `api.get/post/...` (`src/services/apiClient.ts`, ya con manejo de token y errores).
- **Filtros en la URL:** `/?materia=sis-bases&q=normalizacion&vista=favoritos&autor=u4`. Se pueden compartir, recargar y navegar con atrás/adelante.
- **Sincronización:** al crear, editar o eliminar, `DataSyncContext.invalidatePosts()` hace que feed, contadores del sidebar y estadísticas del perfil se vuelvan a pedir (equivalente a invalidar queries en TanStack Query).
- **Modal route:** `/publicar` y `/publicar/:id/editar` guardan la pantalla anterior en `location.state.backgroundLocation` y la dejan renderizada debajo. Si entras directo por enlace, el fondo es el feed.

## Decisiones de UX y supuestos

- **Nombre de la app:** "IngeNotes"
- **Layout:** ≥1280 px tres columnas (sidebar 260 · feed máx. 720 · aside 280); 1024–1279 sidebar colapsable con el botón del header y "Añadir recurso" pasa al header; 768–1023 sidebar como drawer de 320 px y FAB; <768 header compacto, drawer a pantalla completa (con "Mi cuenta" y "Cerrar sesión" al pie) y FAB solo con ícono.
- **Contraste:** el header es `primary-500` con texto blanco solo grande (nombre de 20 px seminegrita) e íconos; los botones con texto normal sobre el header usan `primary-700`. Los botones principales van en `primary-600`.
- **Filtro de carrera además de materia:** los chips de carrera de la tarjeta son clicables, por eso el sidebar tiene "Todo Ing. …" por carrera. Materia y carrera son excluyentes; autor y búsqueda se combinan.
- **Columna derecha:** muestra los usuarios favoritos; al hacer clic se filtra el feed por ese autor.
- **Valoración:** se hace desde la tarjeta ("Valorar" → 1 a 5 estrellas). No puedes valorar tus propios recursos.
- **Foros:** la pestaña "Foro" aparece junto a Recientes y Favoritos solo cuando hay una carrera o materia seleccionada (`vista=foro`); en el inicio sin filtro no se muestra. El foro de una carrera reúne las preguntas de todas sus materias. Cada pregunta abre su hilo en `/foro/:id`, donde se responde y quien preguntó puede marcar una respuesta como solución. La búsqueda y el filtro de autor también aplican al foro.
- **Subida de archivos:** cada archivo se sube al seleccionarlo (progreso simulado) y "Publicar" se habilita cuando terminan. Se aceptan PDF, PNG y JPG de hasta 10 MB (`MAX_FILE_SIZE_MB`). Los enlaces se validan y se les agrega `https://` si falta.
- **Cambios sin guardar:** Cancelar, Esc o clic fuera piden confirmar el descarte; recargar o cerrar la pestaña muestra el aviso del navegador. El botón "atrás" del navegador cierra el modal sin preguntar (bloquearlo requiere migrar a `createBrowserRouter`).
- **Registro:** `/registro` pide nombre, apellido, correo, carrera y contraseña; crea la cuenta en el mock e inicia sesión directamente. "¿Olvidaste tu contraseña?" simula el envío del enlace.
- **Correo:** se acepta cualquier dominio (no solo institucional); solo se valida el formato. No se permiten dos cuentas con el mismo correo.
- **Modo oscuro:** no se incluyó para no duplicar la validación de contraste de toda la paleta; los tokens en `tokens.css` lo dejan preparado.
- **Miniaturas del mock:** las imágenes de ejemplo son SVG generados (diagramas) y los PDF de ejemplo se generan al descargarlos, para que todo funcione sin conexión.

## Dónde se conecta el backend real

| Archivo | Función | Endpoint sugerido (Spring Boot) |
| --- | --- | --- |
| `services/authService.ts` | `register`, `login`, `logout`, `restoreSession` | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` (o Supabase Auth) |
| | `requestPasswordReset`, `changePassword` | `POST /api/auth/password-reset`, `PUT /api/auth/password` |
| | `deleteAccount` | `DELETE /api/users/me` |
| | `currentUserId` | Se elimina: el backend identifica al usuario por el token |
| `services/catalogService.ts` | `getCareers` | `GET /api/careers?include=subjects,postCount` |
| `services/postService.ts` | `getPosts` | `GET /api/posts?q=&careerId=&subjectId=&authorId=&favorites=&page=&size=` |
| | `getPost`, `createPost`, `updatePost`, `deletePost` | `GET/POST/PUT/DELETE /api/posts[/:id]` |
| | `ratePost` | `PUT /api/posts/:id/rating` |
| | `uploadAttachment` | `POST /api/attachments` (multipart → Supabase Storage); progreso real con `XMLHttpRequest.upload.onprogress` |
| | `downloadAttachment` | URL firmada de Supabase Storage |
| `services/forumService.ts` | `getThreads`, `getThread` | `GET /api/forum/threads?careerId=&subjectId=&authorId=&q=&page=&size=`, `GET /api/forum/threads/:id` |
| | `createThread`, `deleteThread` | `POST /api/forum/threads`, `DELETE /api/forum/threads/:id` |
| | `createReply`, `deleteReply` | `POST /api/forum/threads/:id/replies`, `DELETE /api/forum/replies/:id` |
| | `setAcceptedReply` | `PUT /api/forum/threads/:id/accepted` |
| `services/userService.ts` | `getUserStats` | `GET /api/users/:id/stats` |
| | `getFavorites`, `addFavorite`, `removeFavorite` | `GET/POST/DELETE /api/users/me/favorites[/:userId]` |
| | `updateProfile` | `PUT /api/users/me` (multipart con la foto) |
| `services/apiClient.ts` | `api`, `setAuthToken` | URL base en `VITE_API_URL` (`.env`, ver `.env.example`) |
| `services/mappers.ts` | DTO del mock | Se elimina: el backend devuelve los DTO de `src/types` |
| `pages/LoginPage.tsx` | Caja "Cuenta de prueba" | Se elimina junto con `src/mocks/` |
