import type { SupportTicketType } from "@muchasvidas/shared";
import { pool } from "../db";

export interface SupportTicketRecord {
  id_ticket: number;
  id_usuario: number;
  asunto: string;
  descripcion: string;
  tipo: SupportTicketType;
  estado: "abierto" | "cerrado";
  f_creacion: string | Date;
  contacto_email: string | null;
}

interface CreateTicketInput {
  userId: number;
  asunto: string;
  descripcion: string;
  tipo: SupportTicketType;
  contactoEmail: string | null;
}

let ensureTablePromise: Promise<void> | null = null;

const ensureSupportTable = async (): Promise<void> => {
  if (!ensureTablePromise) {
    ensureTablePromise = pool
      .query(
        `CREATE TABLE IF NOT EXISTS ticket_soporte (
          id_ticket SERIAL PRIMARY KEY,
          id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
          asunto TEXT NOT NULL,
          descripcion TEXT NOT NULL,
          tipo TEXT NOT NULL CHECK (tipo IN ('consulta', 'bug')),
          estado TEXT NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
          contacto_email TEXT,
          f_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
        )`
      )
      .then(() => undefined)
      .catch((error) => {
        ensureTablePromise = null;
        throw error;
      });
  }
  await ensureTablePromise;
};

export async function createSupportTicket(input: CreateTicketInput): Promise<SupportTicketRecord> {
  await ensureSupportTable();
  const result = await pool.query<SupportTicketRecord>(
    `INSERT INTO ticket_soporte (id_usuario, asunto, descripcion, tipo, contacto_email)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id_ticket, id_usuario, asunto, descripcion, tipo, estado, f_creacion, contacto_email`,
    [input.userId, input.asunto, input.descripcion, input.tipo, input.contactoEmail]
  );

  return result.rows[0];
}

export async function findSupportTicketById(
  userId: number,
  ticketId: number
): Promise<SupportTicketRecord | null> {
  await ensureSupportTable();
  const result = await pool.query<SupportTicketRecord>(
    `SELECT id_ticket, id_usuario, asunto, descripcion, tipo, estado, f_creacion, contacto_email
       FROM ticket_soporte
      WHERE id_ticket = $1 AND id_usuario = $2`,
    [ticketId, userId]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0];
}
