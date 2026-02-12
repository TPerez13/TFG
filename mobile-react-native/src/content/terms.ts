import type { LegalDocumentSection } from './legalTypes';
import { LEGAL_SUPPORT_EMAIL } from './privacy';

export const TERMS_OF_USE_LAST_UPDATED = '12 de febrero de 2026';

export const TERMS_OF_USE_SECTIONS: LegalDocumentSection[] = [
  {
    title: 'Aceptacion de los terminos',
    body:
      'Al usar MuchasVidas aceptas estos terminos de forma preliminar para el entorno del proyecto/TFG.',
  },
  {
    title: 'Descripcion del servicio',
    body:
      'La app permite registrar habitos, visualizar progreso y configurar recordatorios basicos para seguimiento personal.',
  },
  {
    title: 'Registro y cuenta',
    body:
      'Eres responsable de mantener la confidencialidad de tu acceso y de la informacion asociada a tu cuenta.',
  },
  {
    title: 'Uso permitido y prohibido',
    body: [
      'Uso permitido: seguimiento personal de habitos y bienestar.',
      'No esta permitido manipular la app, intentar acceso no autorizado o usarla para fines ilicitos.',
    ],
  },
  {
    title: 'Notificaciones',
    body:
      'Las notificaciones dependen de permisos del sistema y de tu configuracion. No se garantiza la entrega al 100% en todos los dispositivos.',
  },
  {
    title: 'Descargo de responsabilidad (no consejo medico)',
    body:
      'La informacion mostrada no sustituye asesoramiento medico, nutricional ni profesional especializado.',
  },
  {
    title: 'Disponibilidad y cambios del servicio',
    body:
      'Podemos modificar funcionalidades, contenidos o disponibilidad del servicio para mejorar el producto o por mantenimiento.',
  },
  {
    title: 'Propiedad intelectual',
    body:
      'El diseno, contenido y codigo de la app pertenecen a sus autores y no pueden reutilizarse sin autorizacion.',
  },
  {
    title: 'Contacto',
    body: `Para consultas sobre estos terminos: ${LEGAL_SUPPORT_EMAIL}.`,
  },
];
