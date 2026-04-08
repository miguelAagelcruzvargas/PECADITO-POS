import { Router } from "express";
import { getSyncToken } from "../controllers/sync.controller.js";

const router = Router();

router.get("/sync-token/:id", getSyncToken);

export default router;
