import type { LegalDocumentSection } from './legalTypes';
import { LEGAL_SUPPORT_EMAIL } from './privacy';

export const TERMS_OF_USE_LAST_UPDATED = '12 de febrero de 2026';

export const TERMS_OF_USE_SECTIONS: LegalDocumentSection[] = [
  {
    title: 'Aceptación de los términos',
    body:
      'Al usar TrackHabit Loop aceptas estos términos de forma preliminar para el entorno del proyecto/TFG.',
  },
  {
    title: 'Descripción del servicio',
    body:
      'La app permite registrar hábitos, visualizar progreso y configurar recordatorios básicos para seguimiento personal.',
  },
  {
    title: 'Registro y cuenta',
    body:
      'Eres responsable de mantener la confidencialidad de tu acceso y de la información asociada a tu cuenta.',
  },
  {
    title: 'Uso permitido y prohibido',
    body: [
      'Uso permitido: seguimiento personal de hábitos y bienestar.',
      'No está permitido manipular la app, intentar acceso no autorizado o usarla para fines ilícitos.',
    ],
  },
  {
    title: 'Notificaciones',
    body:
      'Las notificaciones dependen de permisos del sistema y de tu configuración. No se garantiza la entrega al 100% en todos los dispositivos.',
  },
  {
    title: 'Descargo de responsabilidad (no consejo médico)',
    body:
      'La información mostrada no sustituye asesoramiento médico, nutricional ni profesional especializado.',
  },
  {
    title: 'Disponibilidad y cambios del servicio',
    body:
      'Podemos modificar funcionalidades, contenidos o disponibilidad del servicio para mejorar el producto o por mantenimiento.',
  },
  {
    title: 'Propiedad intelectual',
    body:
      'El diseño, contenido y código de la app pertenecen a sus autores y no pueden reutilizarse sin autorización.',
  },
  {
    title: 'Contacto',
    body: `Para consultas sobre estos términos: ${LEGAL_SUPPORT_EMAIL}.`,
  },
];
