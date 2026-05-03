# README de entrega TFG

## Proyecto

MuchasVidasV2 / TrackHabit Loop es un monorepo con:

- Backend Node.js, Express, TypeScript y PostgreSQL en `backend/`.
- App movil Expo / React Native en `mobile-react-native/`.
- Paquete compartido de tipos y reglas de dominio en `packages/shared/`.
- Esquema de base de datos PostgreSQL en `database/init.sql`.
- Documentacion tecnica y diagramas fuente en `docs/`.

## Contenido del ZIP

El ZIP de entrega incluye solo artefactos necesarios para revisar, ejecutar y validar el software:

- `README.md` y este `README_ENTREGA.md`.
- `package.json`, `package-lock.json`, `tsconfig.json` y `docker-compose.yml` de la raiz.
- Codigo fuente, configuracion, tests y `.env.example` de `backend/`.
- Codigo fuente, assets necesarios, configuracion, tests, checklist manual y `.env.example` de `mobile-react-native/`.
- Codigo fuente y configuracion de `packages/shared/`.
- `database/init.sql`.
- Documentacion editable en `docs/`, incluyendo fuentes PlantUML y scripts de renderizado.
- Activos necesarios del proyecto, como logos usados por la app.

No incluye `.env` reales, secretos, `node_modules`, `dist`, `dist-test`, `build`, `.expo`, `.git`, logs, caches, coverage, salidas generadas ni ficheros personales.

## Requisitos

- Node.js 20.x o compatible.
- npm.
- Docker Desktop o Docker Engine con Docker Compose.
- Para ejecutar la app movil: Expo CLI mediante npm, Android Studio/emulador Android o un dispositivo fisico con Expo compatible.

## Instalacion

Desde la raiz del proyecto:

```powershell
npm install
```

Configurar variables de entorno a partir de los ejemplos:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item mobile-react-native\.env.example mobile-react-native\.env
```

Editar los valores locales si procede:

- `backend/.env`: `DATABASE_URL`, `SESSION_SECRET` y, solo si se prueba email real, `MAIL_FROM` y `RESEND_API_KEY`.
- `mobile-react-native/.env`: `EXPO_PUBLIC_API_URL`. Para emulador Android puede dejarse vacio y la app usa `http://10.0.2.2:3000`; para dispositivo fisico debe apuntar a la IP local del equipo.

## Base de datos

Levantar PostgreSQL y pgAdmin:

```powershell
npm run db:up
```

El contenedor carga `database/init.sql` al inicializar el volumen. Si se necesita recrear la base desde cero:

```powershell
npm run db:reset
```

## Ejecucion

Backend en modo desarrollo:

```powershell
npm run dev:backend
```

App movil:

```powershell
npm run start:mobile
```

Desde Expo, abrir en emulador Android o dispositivo fisico. Tambien se puede usar:

```powershell
npm run android
```

## Pruebas y validacion

Comandos recomendados:

```powershell
npm --prefix backend run test
npm --prefix mobile-react-native run test
npm run typecheck:mobile
```

Resultados ejecutados antes de generar el ZIP:

- `npm --prefix backend run test`: OK, 33 tests pasados, 0 fallos.
- `npm --prefix mobile-react-native run test`: OK, 40 tests pasados, 0 fallos.
- `npm run typecheck:mobile`: OK en ejecucion final.

Nota de ejecucion: una primera ejecucion paralela de `npm run typecheck:mobile` fallo por una carrera con `npm --prefix mobile-react-native run test`, ya que ambos comandos interactuaban con `mobile-react-native/dist-test`. Repetido el typecheck en solitario, paso correctamente.

## Checklist manual

El checklist funcional manual esta en:

```text
mobile-react-native/tests/manual-functional-checklist.md
```

Debe usarse para validar flujos de autenticacion, registro de habitos, progreso, notificaciones y perfil/configuracion.

## Seguridad de entrega

Antes de generar el ZIP se comprobo:

- Los ficheros reales `backend/.env` y `mobile-react-native/.env` existen en local pero no se incluyen.
- Solo se incluyen `.env.example`.
- No se encontraron patrones de secretos de alta confianza fuera de ficheros excluidos.
- `mobile-react-native/.env.example` usa un marcador generico `TU_IP_LOCAL` en lugar de una IP privada concreta.

