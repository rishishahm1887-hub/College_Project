import express from "express";

import {
    generateTrip,
    getTripHistory,
    getSingleTrip,
} from "../controllers/planner.controller.js";

const router = express.Router();

router.post("/generate", generateTrip);
router.get("/history", getTripHistory);
router.get("/:id", getSingleTrip);

export default router;
