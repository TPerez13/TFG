import { Router } from "express";
import { createTicket, getTicketStatus, listFaq } from "../controllers/supportController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/support/faq", requireAuth, listFaq);
router.post("/support/tickets", requireAuth, createTicket);
router.get("/support/status/:ticketId", requireAuth, getTicketStatus);

export default router;
