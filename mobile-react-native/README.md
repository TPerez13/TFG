Muchas Vidas – React Native (TypeScript)

Qué hace
- App Expo + React Native con TypeScript.
- Pantalla única que llama GET /api/health y muestra el resultado.
- Formulario básico de login que hace POST /api/login.

Requisitos
- Node.js 18+ y npm.
- Android Studio con un emulador Android iniciado.
- Backend corriendo localmente en el puerto 3000.

Instalación
```bash
cd mobile-react-native
npm install
```

Ejecución en Android Emulator
```bash
npx expo start --android
```
Esto abrirá el emulador (si no está abierto) y lanzará la app.

Notas importantes
- Desde el emulador Android, la app usa `http://10.0.2.2:3000` para acceder a tu backend (configurado en `src/App.tsx`).
- La app permite tráfico en claro (HTTP) en Android para desarrollo (`app.json` → `android.usesCleartextTraffic=true`). En producción, usa HTTPS.
- React Native no está restringido por CORS como los navegadores; tu backend con `cors()` no bloqueará esta app.

Login de prueba
- Credenciales precargadas en tu DB (según este repo):
  - usuario: `usuario`
  - contraseña: `password`
  - Endpoint: `POST /api/login` con JSON `{ "username": "usuario", "password": "password" }`.
  - La app mostrará el código de estado y el cuerpo JSON devuelto.

Problemas comunes
- Si ves errores de "Network request failed":
  1) Asegúrate de que tu API está levantada: `npm run dev` en el proyecto raíz.
  2) Verifica que el emulador tiene red y que `10.0.2.2:3000` responde en tu host.
  3) Si usas dispositivo físico, sustituye `10.0.2.2` por la IP local de tu PC.
