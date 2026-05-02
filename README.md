## TrackHabit Loop (Monorepo)

Repositorio unificado de TrackHabit Loop con:

- API Express (`backend/`) en TypeScript + PostgreSQL.
- App Expo/React Native (`mobile-react-native/`).
- Paquete compartido de tipos, DTOs y reglas de dominio (`packages/shared/`).
- Documentación técnica y diagramas PlantUML (`docs/`).

## Estructura del repositorio

- `backend/`: API REST, controladores, servicios, modelos, middleware, scripts y tests del servidor.
- `mobile-react-native/src/features/`: pantallas, hooks, componentes y lógica específica por dominio funcional.
- `mobile-react-native/src/components/`: componentes transversales (`layout/` y `ui/`).
- `mobile-react-native/src/navigation/`: stacks, tabs y tipos de navegación.
- `mobile-react-native/src/services/`: cliente HTTP y utilidades de integración con la API.
- `mobile-react-native/src/theme/`: tokens y estilos compartidos de la app.
- `packages/shared/`: contratos y lógica compartida entre backend y móvil.
- `database/init.sql`: esquema inicial y datos base de PostgreSQL.
- `docs/diagrams/`: fuentes de diagramas y notas de documentación.

La app móvil usa una organización híbrida:

- infraestructura común en `navigation/`, `services/`, `config/`, `theme/` y `components/{layout,ui}`;
- pantallas, hooks y componentes específicos dentro de `features/<dominio>/`.

Dominios principales de la app móvil:

- autenticación y recuperación de contraseña;
- hábitos, hidratación, sueño, ejercicio, meditación y nutrición;
- progreso, historial y logros;
- notificaciones y recordatorios locales;
- perfil, privacidad, soporte e información de la app.

## Requisitos

- Node.js 18+ y npm >= 8.
- Docker Desktop con Docker Compose.

## Instalación

```bash
npm install
```

## Scripts principales

```bash
npm run build
npm run dev:backend
npm run start:backend
npm run start:mobile
npm run typecheck:mobile
npm run build:shared
npm run android
npm run ios
```

- `build`: compila `packages/shared` y `backend`.
- `dev:backend`: arranca la API en modo desarrollo.
- `start:backend`: arranca la API compilada desde `backend/dist`.
- `start:mobile`: arranca Expo.
- `typecheck:mobile`: ejecuta el typecheck de la app móvil.
- `build:shared`: compila el paquete compartido.
- `android` / `ios`: ejecutan la app móvil con Expo prebuild/run.

Tests disponibles:

```bash
npm --prefix backend run test
npm --prefix backend run test:unit
npm --prefix backend run test:integration
npm --prefix mobile-react-native run test
```

## Variables de entorno del backend

```bash
cp backend/.env.example backend/.env
```

El backend usa `DATABASE_URL` para conectarse a PostgreSQL.

Variables principales:

- `HOST=0.0.0.0` para aceptar conexiones desde la red local en desarrollo.
- `PORT=3000`.
- `DATABASE_URL=postgres://postgres:postgres@localhost:5432/muchasvidas`.
- `SESSION_SECRET=change_me`.

Variables opcionales para recuperación de contraseña por correo:

- `MAIL_PROVIDER=disabled|resend`.
- `MAIL_FROM=onboarding@resend.dev|no-reply@tu-dominio.com`.
- `RESEND_API_KEY=re_xxxxx`.

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
- `db:down`: detiene los contenedores.
- `db:reset`: borra volúmenes y vuelve a ejecutar `database/init.sql`.
- `db:sync-schema`: reaplica `database/init.sql` sobre la base existente sin borrar el volumen. Es útil cuando añadiste tablas o columnas con sentencias idempotentes.
- `db:seed`: compila el monorepo y carga 5 usuarios demo con hábitos, preferencias y logros diferentes.
- `db:logs`: muestra logs de PostgreSQL y pgAdmin.

Configuración actual de PostgreSQL en `docker-compose.yml`:

- Host: `localhost`.
- Puerto: `5432`.
- Database: `muchasvidas` (identificador técnico legacy).
- Usuario: `postgres`.
- Password: `postgres`.

## pgAdmin

Acceso a pgAdmin:

- URL: `http://localhost:5050`.
- Email: `admin@muchasvidas.com` (identificador técnico legacy).
- Password: `admin`.

Dentro de pgAdmin, crea un servidor nuevo con:

- Name: `muchasvidas-db` (identificador técnico legacy; puedes usar cualquier etiqueta visual).
- Host name/address: `db`.
- Port: `5432`.
- Maintenance database: `muchasvidas` (identificador técnico legacy).
- Username: `postgres`.
- Password: `postgres`.

Si no ves tablas en `public`:

1. Ejecuta `npm run db:up`.
2. Si la BD ya existía y no cargó el script inicial, ejecuta `npm run db:reset`.
3. En pgAdmin refresca `Schemas > public > Tables`.

Si cambias `database/init.sql` y quieres reflejarlo en el contenedor:

1. Para cambios compatibles e idempotentes, ejecuta `npm run db:sync-schema`.
2. Si cambiaste algo destructivo o quieres recrear todo desde cero, ejecuta `npm run db:reset`.
3. Si además quieres recargar usuarios demo, ejecuta `npm run db:seed`.

Si `http://localhost:5050` no abre:

1. Verifica que Docker Desktop esté iniciado.
2. Ejecuta `npm run db:up`.
3. Revisa `npm run db:logs` y confirma que `muchasvidas-pgadmin` esté en estado `running`.

## API

- Desarrollo: `npm run dev:backend`.
- Acceso desde el propio ordenador: `http://localhost:3000`.
- Acceso desde un móvil físico en la misma Wi-Fi: `http://<IP-LAN-PC>:3000`.
- Build y arranque:
  - `npm run build`.
  - `npm run start:backend`.

Con `HOST=0.0.0.0`, el backend queda accesible desde otros dispositivos de la red local. Al arrancar, el servidor imprime también las URLs LAN detectadas para que puedas copiar la IP correcta en el entorno de la app móvil.

Endpoints públicos:

- `GET /api/health`.
- `POST /api/login`.
- `POST /api/register`.
- `POST /api/password/forgot`.
- `POST /api/password/reset`.
- `GET /api/app/info`.

Endpoints protegidos con autenticación:

- `GET /api/users/me`.
- `PUT /api/users/me`.
- `PATCH /api/users/me/password`.
- `GET /api/users/me/export`.
- `DELETE /api/users/me`.
- `GET /api/habits/entries`.
- `POST /api/habits/entries`.
- `DELETE /api/habits/entries/:id`.
- `GET /api/achievements`.
- `GET /api/nutrition/today`.
- `GET /api/nutrition/recent`.
- `GET /api/nutrition/frequent`.
- `POST /api/nutrition/entries`.
- `DELETE /api/nutrition/entries/:id`.
- `GET /api/notifications/settings`.
- `PATCH /api/notifications/settings`.
- `GET /api/notifications`.
- `GET /api/notifications/unread-count`.
- `GET /api/notifications/:id`.
- `PATCH /api/notifications/:id/read`.
- `PATCH /api/notifications/read-all`.
- `DELETE /api/notifications/:id`.
- `POST /api/notifications/seed`.
- `GET /api/support/faq`.
- `POST /api/support/tickets`.
- `GET /api/support/status/:ticketId`.

## App móvil

```bash
npm run start:mobile
```

Configuración recomendada:

```bash
cp mobile-react-native/.env.example mobile-react-native/.env
```

La app usa `EXPO_PUBLIC_API_URL` como fuente de verdad para la URL del backend.

Escenarios soportados:

- Emulador Android: puedes dejar `EXPO_PUBLIC_API_URL` sin definir y la app usará `http://10.0.2.2:3000`.
- Simulador iOS o entorno local equivalente: puedes dejar `EXPO_PUBLIC_API_URL` sin definir y la app usará `http://localhost:3000`.
- Móvil físico en la misma red: define `EXPO_PUBLIC_API_URL=http://<IP-LAN-PC>:3000`.
- Producción o staging: define `EXPO_PUBLIC_API_URL=https://api.tu-dominio.com`.

Operativa local recomendada:

1. Crea `backend/.env` y `mobile-react-native/.env` a partir de sus ejemplos.
2. Arranca la base de datos con `npm run db:up`.
3. Arranca la API con `npm run dev:backend`.
4. Si pruebas en un móvil físico, usa la IP LAN que imprime el backend al arrancar.
5. Arranca la app con `npm run start:mobile`.

## Paquete compartido

Tras cambiar `packages/shared/src/index.ts` o módulos compartidos como `dailyGoals`, `achievements` o `reminderPolicies`:

```bash
npm run build:shared
```

El build completo del monorepo también compila el paquete compartido:

```bash
npm run build
```
