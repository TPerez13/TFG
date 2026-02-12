import type {
  SupportFaqItem,
  SupportFaqResponse,
  SupportTicket,
  SupportTicketRequest,
  SupportTicketResponse,
  SupportTicketStatusResponse,
} from "@muchasvidas/shared";
import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { AppError } from "../utils/errors";
import { createSupportTicket, findSupportTicketById } from "../model/supportModel";
import type { SupportTicketRecord } from "../model/supportModel";

const FAQ_ITEMS: SupportFaqItem[] = [
  {
    id: "faq-1",
    pregunta: "Como registro un habito?",
    respuesta: "En el panel diario pulsa el habito, introduce el valor y guarda.",
  },
  {
    id: "faq-2",
    pregunta: "Como activo recordatorios?",
    respuesta: "Desde Perfil > Notificaciones puedes configurar horarios y categorias.",
  },
  {
    id: "faq-3",
    pregunta: "Puedo editar un registro ya guardado?",
    respuesta: "Por ahora solo puedes crear nuevos registros. La edicion llegara en una siguiente version.",
  },
  {
    id: "faq-4",
    pregunta: "Que pasa si cierro sesion?",
    respuesta: "Tus datos quedan guardados en servidor y se recuperan al volver a iniciar sesion.",
  },
  {
    id: "faq-5",
    pregunta: "Como cambio mis preferencias de privacidad?",
    respuesta: "En Perfil > Privacidad puedes activar o desactivar cada opcion.",
  },
  {
    id: "faq-6",
    pregunta: "Como reporto un error?",
    respuesta: "En Ayuda y Soporte usa el bloque Reportar un error y envia el formulario rapido.",
  },
  {
    id: "faq-7",
    pregunta: "Que incluye la exportacion de datos?",
    respuesta: "Incluye tu perfil y registros basicos de habitos en formato JSON.",
  },
  {
    id: "faq-8",
    pregunta: "Como elimino mi cuenta?",
    respuesta: "En Privacidad, seccion Gestion, pulsa Eliminar mi cuenta y confirma los dos pasos.",
  },
];

const toIsoString = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    return value;
  }
  return new Date().toISOString();
};

const toTicketDto = (record: SupportTicketRecord): SupportTicket => ({
  id_ticket: record.id_ticket,
  id_usuario: record.id_usuario,
  asunto: record.asunto,
  descripcion: record.descripcion,
  tipo: record.tipo,
  estado: record.estado,
  f_creacion: toIsoString(record.f_creacion),
  contacto_email: record.contacto_email,
});

const formatTicketNumber = (ticketId: number): string => `SUP-${String(ticketId).padStart(6, "0")}`;

export async function createTicket(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Token invalido.", 401);
    }

    const payload = (req.body ?? {}) as SupportTicketRequest;
    const asunto = typeof payload.asunto === "string" ? payload.asunto.trim() : "";
    const descripcion = typeof payload.descripcion === "string" ? payload.descripcion.trim() : "";
    const tipo = payload.tipo === "bug" ? "bug" : payload.tipo === "consulta" ? "consulta" : undefined;
    const contactoEmail =
      typeof payload.contactoEmail === "string" && payload.contactoEmail.trim().length > 0
        ? payload.contactoEmail.trim()
        : null;

    if (asunto.length < 3) {
      throw new AppError("El asunto debe tener al menos 3 caracteres.", 400);
    }
    if (descripcion.length < 10) {
      throw new AppError("La descripcion debe tener al menos 10 caracteres.", 400);
    }
    if (!tipo) {
      throw new AppError("Tipo de ticket invalido.", 400);
    }

    let finalDescripcion = descripcion;
    if (payload.deviceInfo && typeof payload.deviceInfo === "object") {
      finalDescripcion = `${descripcion}\n\n[deviceInfo]\n${JSON.stringify(payload.deviceInfo)}`;
    }

    const created = await createSupportTicket({
      userId,
      asunto,
      descripcion: finalDescripcion,
      tipo,
      contactoEmail,
    });

    const response: SupportTicketResponse = {
      message: "Ticket creado correctamente.",
      ticket: toTicketDto(created),
      ticketNumber: formatTicketNumber(created.id_ticket),
    };
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
}

export async function listFaq(_req: AuthRequest, res: Response): Promise<void> {
  const response: SupportFaqResponse = { items: FAQ_ITEMS };
  res.json(response);
}

export async function getTicketStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      throw new AppError("Token invalido.", 401);
    }

    const ticketId = Number(req.params.ticketId);
    if (!ticketId || Number.isNaN(ticketId)) {
      throw new AppError("ticketId invalido.", 400);
    }

    const ticket = await findSupportTicketById(userId, ticketId);
    if (!ticket) {
      throw new AppError("Ticket no encontrado.", 404);
    }

    const response: SupportTicketStatusResponse = {
      ticketId: ticket.id_ticket,
      status: ticket.estado,
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
}
