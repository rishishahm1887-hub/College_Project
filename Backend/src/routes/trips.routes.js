import express from "express";

import {
  getMySavedPlaces,
  addPlaceToMyTrip,
  generateMyTrip,
  getGeneratedTrips,
  getGeneratedTrip,
  deleteSavedPlace,
  deleteAllSavedPlaces,
} from "../controllers/trips.controller.js";

const router = express.Router();

router.get("/", getMySavedPlaces);
router.post("/", addPlaceToMyTrip);
router.post("/generate", generateMyTrip);
router.get("/generated", getGeneratedTrips);
router.get("/generated/:id", getGeneratedTrip);
router.delete("/:placeId", deleteSavedPlace);
router.delete("/", deleteAllSavedPlaces);

export default router;