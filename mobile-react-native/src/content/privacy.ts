import type { LegalDocumentSection } from './legalTypes';

export const PRIVACY_POLICY_LAST_UPDATED = '12 de febrero de 2026';
export const LEGAL_SUPPORT_EMAIL = 'support@trackhabitloop.com';

export const PRIVACY_POLICY_SECTIONS: LegalDocumentSection[] = [
  {
    title: 'Responsable del tratamiento',
    body: [
      'Este proyecto/app (TrackHabit Loop) es responsable del tratamiento de los datos que introduces en la plataforma.',
      `Para consultas puedes escribir a ${LEGAL_SUPPORT_EMAIL}.`,
    ],
  },
  {
    title: 'Datos que recogemos',
    body: [
      'Datos de cuenta: correo, nombre y hash de contrasena (nunca guardamos la contrasena en texto plano).',
      'Preferencias de usuario: tema, idioma y configuraciones de notificaciones.',
      'Registros de habitos: hidratacion, ejercicio, nutricion, sueno y meditacion.',
      'Datos tecnicos minimos: errores y logs basicos para diagnostico cuando aplique.',
    ],
  },
  {
    title: 'Para que usamos los datos',
    body: [
      'Autenticacion y gestion de sesion.',
      'Personalizacion de la experiencia de usuario.',
      'Seguimiento de progreso y estadisticas de habitos.',
      'Envio de recordatorios, si el usuario los activa.',
    ],
  },
  {
    title: 'Conservacion',
    body:
      'Conservamos los datos mientras la cuenta este activa. Si eliminas tu cuenta, se eliminan los datos asociados segun las reglas de borrado de la plataforma.',
  },
  {
    title: 'Cesion a terceros',
    body:
      'Actualmente no compartimos tus datos personales con terceros para fines comerciales. Si en el futuro se integran APIs externas, se informara de forma transparente.',
  },
  {
    title: 'Seguridad',
    body: [
      'Las credenciales se almacenan como hash.',
      'El acceso a datos esta controlado por usuario autenticado.',
      'En despliegue se recomienda HTTPS para proteger el trafico.',
      'Las sesiones se gestionan mediante tokens JWT.',
    ],
  },
  {
    title: 'Derechos del usuario',
    body:
      'Puedes solicitar acceso, rectificacion y supresion de tus datos. Tambien puedes pedir portabilidad cuando la exportacion de datos este disponible.',
  },
  {
    title: 'Contacto',
    body: `Para privacidad o soporte: ${LEGAL_SUPPORT_EMAIL}.`,
  },
];
