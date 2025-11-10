## Muchas Vidas (TypeScript + PostgreSQL)

Esqueleto minimalista de una API Express en TypeScript con autenticación básica contra PostgreSQL. Incluye `docker-compose` para levantar la base de datos y un usuario predefinido (`usuario` / `password`).

### Requisitos previos
- Node.js 18+ y npm.
- Docker + Docker Compose.

### Instalación
```bash
npm install
```

### Variables de entorno
Duplica `.env.example` a `.env` y ajusta valores si lo necesitas. El valor por defecto de `DATABASE_URL` coincide con el servicio definido en `docker-compose.yml`.

### Levantar PostgreSQL
```bash
docker-compose up -d
```
Esto crea la base de datos `muchasvidas` con la tabla `users` y un usuario por defecto.

### Ejecución en desarrollo
```bash
npm run dev
```
La API escuchará (por defecto) en `http://localhost:3000`.

### Endpoints principales
- `POST /api/login`  
  Cuerpo esperado:
  ```json
  {
    "username": "usuario",
    "password": "password"
  }
  ```
  Respuesta exitosa:
  ```json
  {
    "message": "Inicio de sesión correcto.",
    "user": {
      "id": 1,
      "username": "usuario"
    }
  }
  ```

- `GET /api/health` – Verificación rápida del estado del servicio.

### Construcción y ejecución en producción
```bash
npm run build
npm start
```
