import mongoose from "mongoose";

import GeneratedTrip from "../models/GeneratedTrip.js";

import { buildTripPlan } from "../services/tripPlanner.js";

/*
=====================================================
GET CURRENT CLERK USER
=====================================================
*/

function getUserId(req) {
    try {
        const auth = req.auth();

        return auth?.userId || null;
    } catch (error) {
        return null;
    }
}

/*
=====================================================
GENERATE TRIP
=====================================================
POST /api/planner/generate
=====================================================
*/

export const generateTrip = async (req, res, next) => {
    try {
        /*
            =============================================
            GET USER ID
            =============================================
            */

        const userId = getUserId(req);

        /*
            =============================================
            CHECK AUTHENTICATION
            =============================================
            */

        if (!userId) {
            return res.status(401).json({
                success: false,

                message: "You must be signed in to generate a trip.",
            });
        }

        /*
            =============================================
            GET REQUEST DATA
            =============================================
            */

        const days = req.body.days;

        const budget = req.body.budget;

        const travelingWith = req.body.travelingWith;

        const transportation = req.body.transportation;

        const interests = req.body.interests;

        /*
            =============================================
            BUILD TRIP PLAN
            =============================================
            */

        const plan = await buildTripPlan({
            days: days,

            budget: budget,

            travelingWith: travelingWith,

            transportation: transportation,

            interests: interests,
        });

        /*
            =============================================
            SAVE GENERATED TRIP
            =============================================
            */

        const generatedTrip = await GeneratedTrip.create({
            userId: userId,

            preferences: plan.preferences,

            estimatedCost: plan.estimatedCost,

            budgetWithinLimit: plan.budgetWithinLimit,

            budgetNote: plan.budgetNote,

            days: plan.days,
        });

        /*
            =============================================
            GET SAVED TRIP WITH PLACE INFORMATION
            =============================================
            */

        const populatedTrip = await GeneratedTrip.findById(generatedTrip._id)
            .populate("days.places.placeId")
            .lean();

        /*
            =============================================
            SEND RESPONSE
            =============================================
            */

        return res.status(201).json({
            success: true,

            message: "Trip generated successfully.",

            trip: populatedTrip,
        });
    } catch (error) {
        next(error);
    }
};

/*
=====================================================
GET TRIP HISTORY
=====================================================
GET /api/planner/history
=====================================================
*/

export const getTripHistory = async (req, res, next) => {
    try {
        /*
            =============================================
            GET USER ID
            =============================================
            */

        const userId = getUserId(req);

        /*
            =============================================
            CHECK AUTHENTICATION
            =============================================
            */

        if (!userId) {
            return res.status(401).json({
                success: false,

                message: "Unauthorized.",
            });
        }

        /*
            =============================================
            GET USER'S TRIPS
            =============================================
            */

        const trips = await GeneratedTrip.find({
            userId: userId,
        })
            .sort({
                createdAt: -1,
            })
            .limit(20)
            .populate("days.places.placeId")
            .lean();

        /*
            =============================================
            SEND RESPONSE
            =============================================
            */

        return res.json({
            success: true,

            trips: trips,
        });
    } catch (error) {
        next(error);
    }
};

/*
=====================================================
GET SINGLE GENERATED TRIP
=====================================================
GET /api/planner/:id
=====================================================
*/

export const getSingleTrip = async (req, res, next) => {
    try {
        /*
            =============================================
            GET USER ID
            =============================================
            */

        const userId = getUserId(req);

        /*
            =============================================
            CHECK AUTHENTICATION
            =============================================
            */

        if (!userId) {
            return res.status(401).json({
                success: false,

                message: "Unauthorized.",
            });
        }

        /*
            =============================================
            GET TRIP ID
            =============================================
            */

        const id = req.params.id;

        /*
            =============================================
            CHECK TRIP ID
            =============================================
            */

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,

                message: "Invalid trip ID.",
            });
        }

        /*
            =============================================
            FIND TRIP
            =============================================
            */

        const trip = await GeneratedTrip.findOne({
            _id: id,

            userId: userId,
        })
            .populate("days.places.placeId")
            .lean();

        /*
            =============================================
            CHECK IF TRIP EXISTS
            =============================================
            */

        if (!trip) {
            return res.status(404).json({
                success: false,

                message: "Trip not found.",
            });
        }

        /*
            =============================================
            SEND RESPONSE
            =============================================
            */

        return res.json({
            success: true,

            trip: trip,
        });
    } catch (error) {
        next(error);
    }
};
