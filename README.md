## TrackHabit Loop (Monorepo)

Repositorio unificado de TrackHabit Loop con:
- API Express (`backend/`) en TypeScript + PostgreSQL.
- App Expo/React Native (`mobile-react-native/`).
- Paquete compartido de tipos/DTOs (`packages/shared/`).

## Estructura del repositorio

- `backend/`: API REST, middleware, persistencia y tests del servidor.
- `mobile-react-native/src/features/`: organización principal de la app móvil por dominios funcionales.
- `mobile-react-native/src/components/`: solo componentes transversales (`layout/` y `ui/`).
- `packages/shared/`: contratos y lógica compartida entre backend y móvil.
- `docs/diagrams/`: fuentes de diagramas y notas de documentación.

La app móvil sigue un criterio híbrido pero explícito:
- infraestructura común en `navigation/`, `services/`, `config/`, `theme/` y `components/{layout,ui}`;
- pantallas, hooks y componentes específicos dentro de `features/<dominio>/`.

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

Variables principales:

- `HOST=0.0.0.0` para aceptar conexiones desde la red local en desarrollo.
- `PORT=3000`
- `DATABASE_URL=postgres://...`
- `SESSION_SECRET=...`

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
npm run db:sync-schema
npm run db:seed
npm run db:logs
```

- `db:up`: levanta PostgreSQL y pgAdmin en Docker.
- `db:reset`: borra volúmenes y vuelve a ejecutar `database/init.sql` (útil para volver a sembrar datos).
- `db:sync-schema`: reaplica `database/init.sql` sobre la base ya existente sin borrar el volumen. Útil cuando añadiste tablas/columnas con `IF NOT EXISTS` o `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
- `db:seed`: compila el monorepo y carga 5 usuarios demo con hábitos, preferencias y logros diferentes.

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

Si cambias `database/init.sql` y quieres reflejarlo en el contenedor:
1. Para cambios compatibles e idempotentes, ejecuta `npm run db:sync-schema`.
2. Si cambiaste algo destructivo o quieres recrear todo desde cero, ejecuta `npm run db:reset`.
3. Si además quieres recargar usuarios demo, ejecuta `npm run db:seed`.

Si `http://localhost:5050` no abre (connection refused):
1. Verifica que Docker Desktop esté iniciado.
2. Ejecuta `npm run db:up`.
3. Revisa `npm run db:logs` y confirma que `muchasvidas-pgadmin` (nombre técnico legacy) esté en estado `running`.

## API

- Desarrollo: `npm run dev:backend`
- Acceso desde el propio ordenador: `http://localhost:3000`
- Acceso desde un movil fisico en la misma Wi-Fi: `http://<IP-LAN-PC>:3000`
- Build y arranque:
  - `npm run build --workspace backend`
  - `npm run start:backend`

Con `HOST=0.0.0.0`, el backend queda accesible desde otros dispositivos de la red local. Al arrancar, el servidor imprime tambien las URLs LAN detectadas para que puedas copiar la IP correcta en el entorno de la app movil.

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

Configuracion recomendada:

```bash
cp mobile-react-native/.env.example mobile-react-native/.env
```

La app usa `EXPO_PUBLIC_API_URL` como fuente de verdad para la URL del backend.

Escenarios soportados:

- Emulador Android: puedes dejar `EXPO_PUBLIC_API_URL` sin definir y la app usara `http://10.0.2.2:3000`.
- Simulador iOS / entorno local equivalente: puedes dejar `EXPO_PUBLIC_API_URL` sin definir y la app usara `http://localhost:3000`.
- Movil fisico en la misma red: define `EXPO_PUBLIC_API_URL=http://<IP-LAN-PC>:3000`.
- Produccion o staging: define `EXPO_PUBLIC_API_URL=https://api.tu-dominio.com`.

Operativa local recomendada:

1. Crea `backend/.env` y `mobile-react-native/.env` a partir de sus ejemplos.
2. Arranca la API con `npm run dev:backend`.
3. Si pruebas en un movil fisico, usa la IP LAN que imprime el backend al arrancar.
4. Arranca la app con `npm run start:mobile`.

## Paquete compartido

Tras cambiar `packages/shared/src/index.ts`:

```bash
npm run build:shared
```
