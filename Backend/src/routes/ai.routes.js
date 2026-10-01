import express from "express";

import {
    aiHealth,
    chat,
} from "../controllers/ai.controller.js";

const router = express.Router();

router.get("/health", aiHealth);
router.post("/chat", chat);


export default router;