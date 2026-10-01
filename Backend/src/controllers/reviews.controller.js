import mongoose from "mongoose";

import TripReview from "../models/TripReview.js";
import GeneratedTrip from "../models/GeneratedTrip.js";

/*
=====================================================
CLERK USER ID
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
GET CURRENT USER'S TRIP REVIEWS
=====================================================
GET /api/reviews
=====================================================
*/

export const getMyReviews = async (req, res, next) => {
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
            FIND USER REVIEWS
            =============================================
            */

        const reviews = await TripReview.find({
            userId: userId,
        })
            .sort({
                createdAt: -1,
            })
            .populate({
                path: "tripId",

                select: [
                    "preferences",
                    "estimatedCost",
                    "budgetWithinLimit",
                    "budgetNote",
                    "days",
                    "createdAt",
                ].join(" "),

                populate: {
                    path: "days.places.placeId",
                },
            })
            .lean();

        /*
            =============================================
            SEND RESPONSE
            =============================================
            */

        return res.json({
            success: true,
            reviews: reviews,
        });
    } catch (error) {
        next(error);
    }
};

/*
=====================================================
CREATE / UPDATE TRIP REVIEW
=====================================================
POST /api/reviews
=====================================================
*/

export const createOrUpdateReview = async (req, res, next) => {
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
                message: "You must be signed in to review a trip.",
            });
        }

        /*
            =============================================
            GET DATA FROM REQUEST
            =============================================
            */

        const tripId = req.body.tripId;

        const rating = req.body.rating;

        const review = req.body.review;

        /*
            =============================================
            VALIDATE TRIP ID
            =============================================
            */

        if (!tripId || !mongoose.Types.ObjectId.isValid(tripId)) {
            return res.status(400).json({
                success: false,
                message: "A valid trip ID is required.",
            });
        }

        /*
            =============================================
            VALIDATE RATING
            =============================================
            */

        const numericRating = Number(rating);

        if (
            !Number.isInteger(numericRating) ||
            numericRating < 1 ||
            numericRating > 5
        ) {
            return res.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5.",
            });
        }

        /*
            =============================================
            CLEAN REVIEW TEXT
            =============================================
            */

        let cleanReview = "";

        if (typeof review === "string") {
            cleanReview = review.trim();
        }

        /*
            =============================================
            CHECK MINIMUM REVIEW LENGTH
            =============================================
            */

        if (cleanReview.length < 3) {
            return res.status(400).json({
                success: false,
                message: "Please write at least 3 characters.",
            });
        }

        /*
            =============================================
            CHECK MAXIMUM REVIEW LENGTH
            =============================================
            */

        if (cleanReview.length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Review cannot exceed 2000 characters.",
            });
        }

        /*
            =============================================
            CHECK TRIP BELONGS TO USER
            =============================================
            */

        const trip = await GeneratedTrip.findOne({
            _id: tripId,
            userId: userId,
        });

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: "Generated trip not found.",
            });
        }

        /*
            =============================================
            CREATE OR UPDATE REVIEW
            =============================================
            */

        const savedReview = await TripReview.findOneAndUpdate(
            {
                userId: userId,
                tripId: tripId,
            },

            {
                $set: {
                    rating: numericRating,
                    review: cleanReview,
                },
            },

            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true,
            },
        )
            .populate({
                path: "tripId",

                populate: {
                    path: "days.places.placeId",
                },
            })
            .lean();

        /*
            =============================================
            SEND RESPONSE
            =============================================
            */

        return res.status(200).json({
            success: true,
            message: "Trip review saved successfully.",
            review: savedReview,
        });
    } catch (error) {
        next(error);
    }
};

/*
=====================================================
GET PUBLIC REVIEWS
=====================================================
GET /api/reviews/public
=====================================================

No authentication required.
=====================================================
*/

export const getPublicReviews = async (req, res, next) => {
    try {
        /*
            =============================================
            FIND PUBLIC REVIEWS
            =============================================
            */

        const reviews = await TripReview.find({})
            .sort({
                createdAt: -1,
            })
            .limit(30)
            .populate({
                path: "tripId",

                select: "preferences estimatedCost createdAt",
            })
            .lean();

        /*
            =============================================
            SEND RESPONSE
            =============================================
            */

        return res.json({
            success: true,
            reviews: reviews,
        });
    } catch (error) {
        next(error);
    }
};

/*
=====================================================
DELETE CURRENT USER'S REVIEW
=====================================================
DELETE /api/reviews/:tripId
=====================================================
*/

export const deleteMyReview = async (req, res, next) => {
    try {
        /*
            =============================================
            GET USER ID
            =============================================
            */

        const userId = getUserId(req);

        const tripId = req.params.tripId;

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
            CHECK TRIP ID
            =============================================
            */

        if (!mongoose.Types.ObjectId.isValid(tripId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid trip ID.",
            });
        }

        /*
            =============================================
            DELETE REVIEW
            =============================================
            */

        const deleted = await TripReview.findOneAndDelete({
            userId: userId,
            tripId: tripId,
        });

        /*
            =============================================
            CHECK IF REVIEW EXISTS
            =============================================
            */

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Review not found.",
            });
        }

        /*
            =============================================
            SEND RESPONSE
            =============================================
            */

        return res.json({
            success: true,
            message: "Review deleted successfully.",
        });
    } catch (error) {
        next(error);
    }
};
