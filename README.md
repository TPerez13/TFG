## TrackHabit Loop (Monorepo)

Repositorio unificado de TrackHabit Loop con:
- API Express (`backend/`) en TypeScript + PostgreSQL.
- App Expo/React Native (`mobile-react-native/`).
- Paquete compartido de tipos/DTOs (`packages/shared/`).

## Requisitos

- Node.js 18+ y npm >= 8.
- Docker Desktop (con Docker Compose).

## Instalacion

```bash
npm install
```

## Variables de entorno (backend)

```bash
cp backend/.env.example backend/.env
```

El backend usa `DATABASE_URL` para conectarse a PostgreSQL.

## Base de datos

Comandos utiles:

```bash
npm run db:up
npm run db:down
npm run db:reset
npm run db:logs
```

- `db:up`: levanta PostgreSQL y pgAdmin en Docker.
- `db:reset`: borra volumenes y vuelve a ejecutar `database/init.sql` (util para volver a sembrar datos).

Configuracion actual de PostgreSQL en `docker-compose.yml`:
- Host: `localhost`
- Puerto: `5432`
- Database: `muchasvidas` (identificador tecnico legacy)
- Usuario: `postgres`
- Password: `postgres`

## pgAdmin (web)

Acceso a pgAdmin:
- URL: `http://localhost:5050`
- Email: `admin@muchasvidas.com` (identificador tecnico legacy)
- Password: `admin`

Dentro de pgAdmin, crea un servidor nuevo con:
- Name: `muchasvidas-db` (identificador tecnico legacy; puedes usar cualquier etiqueta visual)
- Host name/address: `db`
- Port: `5432`
- Maintenance database: `muchasvidas` (identificador tecnico legacy)
- Username: `postgres`
- Password: `postgres`

Si no ves tablas en `public`:
1. Ejecuta `npm run db:up`.
2. Si la BD ya existia y no cargo el script inicial, ejecuta `npm run db:reset`.
3. En pgAdmin refresca `Schemas > public > Tables`.

Si `http://localhost:5050` no abre (connection refused):
1. Verifica que Docker Desktop este iniciado.
2. Ejecuta `npm run db:up`.
3. Revisa `npm run db:logs` y confirma que `muchasvidas-pgadmin` (nombre tecnico legacy) este en estado `running`.

## API

- Desarrollo: `npm run dev:backend` -> `http://localhost:3000`
- Build y arranque:
  - `npm run build --workspace backend`
  - `npm run start:backend`

Endpoints de referencia:
- `GET /api/health`
- `POST /api/login`
- `GET /api/notifications`
- `GET /api/notifications/unread-count`
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`
- `DELETE /api/notifications/:id`
- `PUT /api/notifications/settings`

## App movil

```bash
npm run start:mobile
```

## Paquete compartido

Tras cambiar `packages/shared/src/index.ts`:

```bash
npm run build:shared
```
