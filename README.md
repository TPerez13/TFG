## Muchas Vidas (Monorepo)

Repo unificado con la API Express (TypeScript + PostgreSQL), la app móvil Expo y un paquete de tipos compartidos.

### Estructura
- `backend/`: API Express con PostgreSQL.
- `mobile-react-native/`: app Expo/React Native.
- `packages/shared/`: DTOs y tipos comunes (`@muchasvidas/shared`).
- `database/`: scripts para inicializar la base de datos usada por Docker.

### Requisitos previos
- Node.js 18+ con npm >= 8 (soporte para workspaces).
- Docker + Docker Compose.

### Instalación
```bash
npm install
```
> El paso anterior instala todas las dependencias de los workspaces y compila `packages/shared` (se ejecuta en `postinstall`).

### Variables de entorno
```bash
cp backend/.env.example backend/.env
```
Los valores por defecto enlazan con el servicio de PostgreSQL definido en `docker-compose.yml`.

### Servicios principales
- **Base de datos**: `docker-compose up -d` levanta PostgreSQL con la tabla `users` y el usuario `usuario/password`.
- **API (desarrollo)**: `npm run dev:backend` → http://localhost:3000
- **API (build + start)**:
  ```bash
  npm run build --workspace backend
  npm run start:backend
  ```
- **App móvil**: `npm run start:mobile` abre el bundler de Expo.

### Endpoints de referencia
- `GET /api/health`: estado del servicio.
- `POST /api/login` (ver `packages/shared` para el contrato `LoginRequest`/`LoginResponse`).
- `GET /api/notifications`: listado paginado de notificaciones (auth).
- `GET /api/notifications/unread-count`: contador de no leidas (auth).
- `PATCH /api/notifications/:id/read`: marca leida/no leida (auth).
- `PATCH /api/notifications/read-all`: marca todas como leidas (auth).
- `DELETE /api/notifications/:id`: elimina notificacion (auth).
- `PUT /api/notifications/settings`: guarda preferencias (auth).

### Paquete compartido
`@muchasvidas/shared` expone los DTOs usados tanto por el backend como por la app móvil. Modifica `packages/shared/src/index.ts` y ejecuta:
```bash
npm run build:shared
```
para regenerar los tipos/JS distribuidos.
