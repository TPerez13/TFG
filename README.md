## TrackHabit Loop (Monorepo)

Repositorio unificado de TrackHabit Loop con:
- API Express (`backend/`) en TypeScript + PostgreSQL.
- App Expo/React Native (`mobile-react-native/`).
- Paquete compartido de tipos/DTOs (`packages/shared/`).

## Requisitos

- Node.js 18+ y npm >= 8.
- Docker Desktop (con Docker Compose).

## Instalación

```bash
npm install
```

## Variables de entorno (backend)

```bash
cp backend/.env.example backend/.env
```

El backend usa `DATABASE_URL` para conectarse a PostgreSQL.

Variables opcionales para recuperación de contraseña por correo:

- `MAIL_PROVIDER=disabled|resend`
- `MAIL_FROM=onboarding@resend.dev|no-reply@tu-dominio.com`
- `RESEND_API_KEY=re_xxxxx`

Si `MAIL_PROVIDER=resend` y completas `MAIL_FROM` + `RESEND_API_KEY`, el backend enviará correos reales de recuperación.
Si el proveedor está desactivado o incompleto, la recuperación devolverá `503` también en local para mantener un comportamiento alineado con producción.
Si usas `onboarding@resend.dev`, Resend solo permite enviar al correo propietario de esa cuenta; para destinatarios externos reales necesitas un dominio verificado y un `MAIL_FROM` que pertenezca a ese dominio.

## Base de datos

Comandos útiles:

```bash
npm run db:up
npm run db:down
npm run db:reset
npm run db:logs
```

- `db:up`: levanta PostgreSQL y pgAdmin en Docker.
- `db:reset`: borra volúmenes y vuelve a ejecutar `database/init.sql` (útil para volver a sembrar datos).

Configuración actual de PostgreSQL en `docker-compose.yml`:
- Host: `localhost`
- Puerto: `5432`
- Database: `muchasvidas` (identificador técnico legacy)
- Usuario: `postgres`
- Password: `postgres`

## pgAdmin (web)

Acceso a pgAdmin:
- URL: `http://localhost:5050`
- Email: `admin@muchasvidas.com` (identificador técnico legacy)
- Password: `admin`

Dentro de pgAdmin, crea un servidor nuevo con:
- Name: `muchasvidas-db` (identificador técnico legacy; puedes usar cualquier etiqueta visual)
- Host name/address: `db`
- Port: `5432`
- Maintenance database: `muchasvidas` (identificador técnico legacy)
- Username: `postgres`
- Password: `postgres`

Si no ves tablas en `public`:
1. Ejecuta `npm run db:up`.
2. Si la BD ya existía y no cargó el script inicial, ejecuta `npm run db:reset`.
3. En pgAdmin refresca `Schemas > public > Tables`.

Si `http://localhost:5050` no abre (connection refused):
1. Verifica que Docker Desktop esté iniciado.
2. Ejecuta `npm run db:up`.
3. Revisa `npm run db:logs` y confirma que `muchasvidas-pgadmin` (nombre técnico legacy) esté en estado `running`.

## API

- Desarrollo: `npm run dev:backend` -> `http://localhost:3000`
- Build y arranque:
  - `npm run build --workspace backend`
  - `npm run start:backend`

Endpoints de referencia:
- `GET /api/health`
- `POST /api/login`
- `POST /api/password/forgot`
- `POST /api/password/reset`
- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `DELETE /api/notifications/:id`
- `PUT /api/notifications/settings`

## App móvil

```bash
npm run start:mobile
```

## Paquete compartido

Tras cambiar `packages/shared/src/index.ts`:

```bash
npm run build:shared
```
