import { generateGeminiResponse } from "../services/gemini.service.js";

import { getTourismContext } from "../services/tourismContext.service.js";

import {
    getLivePlacesContext,
    needsLivePlaceSearch,
} from "../services/livePlacesContext.service.js";

/*
=====================================================
AI HEALTH CHECK
=====================================================
GET /api/ai/health
=====================================================
*/

export const aiHealth = (req, res) => {
    return res.json({
        success: true,
        service: "bharatpur-ai-chatbot",
        message: "AI chatbot route is working",
    });
};

/*
=====================================================
BUILD GOOGLE PLACES FALLBACK ANSWER
=====================================================
*/

function buildLivePlacesFallback(message, places = []) {
    /*
      =============================================
      NO PLACES FOUND
      =============================================
      */

    if (places.length === 0) {
        return (
            "I couldn't find matching hotels or restaurants inside " +
            "Bharatpur Metropolitan City right now. Please try another " +
            "food or restaurant name."
        );
    }

    /*
      =============================================
      CREATE RESPONSE LINES
      =============================================
      */

    const lines = [];

    /*
      =============================================
      INTRODUCTION
      =============================================
      */

    let placeWord = "places";

    if (places.length === 1) {
        placeWord = "place";
    }

    lines.push(
        `I found ${places.length} matching ${placeWord} in Bharatpur Metropolitan City for your request:`,
    );

    lines.push("");

    /*
      =============================================
      ADD PLACES
      =============================================
      */

    places.slice(0, 5).forEach((place, index) => {
        /*
                Place name
                */

        let name = "Unnamed place";

        if (place.name) {
            name = place.name;
        } else if (place.displayName) {
            name = place.displayName;
        }

        /*
                Address
                */

        let address = "Address not available";

        if (place.formattedAddress) {
            address = place.formattedAddress;
        } else if (place.address) {
            address = place.address;
        }

        /*
                Rating
                */

        let rating = "Rating not available";

        if (place.rating !== undefined && place.rating !== null) {
            rating = `${place.rating}/5`;
        }

        /*
                Number of reviews
                */

        let reviews = "";

        if (place.userRatingCount !== undefined && place.userRatingCount !== null) {
            reviews = ` (${place.userRatingCount} reviews)`;
        }

        /*
                Business status
                */

        let status = "";

        if (place.businessStatus) {
            status = place.businessStatus;
        } else if (place.openingStatus) {
            status = place.openingStatus;
        }

        /*
                =========================================
                ADD PLACE TO RESPONSE
                =========================================
                */

        lines.push(
            `${index + 1}. ${name}\n` +
            `   Address: ${address}\n` +
            `   Rating: ${rating}${reviews}` +
            (status ? `\n   Status: ${status}` : ""),
        );

        lines.push("");
    });

    /*
      =============================================
      ADD FINAL MESSAGE
      =============================================
      */

    lines.push(
        "These results are based on the live Google Places search for Bharatpur.",
    );

    /*
      =============================================
      RETURN FINAL TEXT
      =============================================
      */

    return lines.join("\n");
}

/*
=====================================================
AI CHAT
=====================================================
POST /api/ai/chat
=====================================================
*/

export const chat = async (req, res) => {
    try {
        /*
            =============================================
            GET DATA FROM REQUEST
            =============================================
            */

        const message = req.body.message;

        const history = req.body.history || [];

        /*
            =============================================
            VALIDATE MESSAGE
            =============================================
            */

        if (typeof message !== "string" || !message.trim()) {
            return res.status(400).json({
                success: false,
                message: "Message is required",
            });
        }

        /*
            =============================================
            CLEAN MESSAGE
            =============================================
            */

        const cleanMessage = message.trim();

        /*
            =============================================
            LOG USER MESSAGE
            =============================================
            */

        console.log("");

        console.log("========================================");

        console.log("🤖 BHARATPUR AI CHAT");

        console.log("User:", cleanMessage);

        console.log("========================================");

        /*
            =============================================
            1. SEARCH MONGODB TOURISM DATA
            =============================================
            */

        console.log("📚 Searching MongoDB...");

        const tourismContext = await getTourismContext(cleanMessage);

        console.log(
            "✅ MongoDB:",
            tourismContext ? "context found" : "no matching context",
        );

        /*
            =============================================
            2. CHECK LIVE GOOGLE PLACES
            =============================================
            */

        let livePlacesContext = "";

        let livePlaces = [];

        const liveSearch = needsLivePlaceSearch(cleanMessage);

        console.log("🔎 Live place search:", liveSearch);

        /*
            =============================================
            SEARCH GOOGLE PLACES IF NEEDED
            =============================================
            */

        if (liveSearch) {
            console.log("🌍 Searching Google Places...");

            const result = await getLivePlacesContext(cleanMessage);

            /*
                  =========================================
                  RESULT CAN BE STRING OR OBJECT
                  =========================================
      
                  Supported formats:
      
                  1. String
      
                  2. {
                      context,
                      places
                  }
                  =========================================
                  */

            if (typeof result === "string") {
                livePlacesContext = result;
            } else {
                livePlacesContext = result?.context || "";

                if (Array.isArray(result?.places)) {
                    livePlaces = result.places;
                } else {
                    livePlaces = [];
                }
            }

            /*
                  =========================================
                  LOG GOOGLE RESULTS
                  =========================================
                  */

            console.log("✅ Google Places:", livePlaces.length, "places");

            console.log("Google context length:", livePlacesContext.length);
        }

        /*
            =============================================
            3. SEND INFORMATION TO GEMINI
            =============================================
            */

        console.log("🧠 Sending request to Gemini...");

        try {
            const answer = await generateGeminiResponse({
                message: cleanMessage,

                history: history,

                tourismContext: tourismContext,

                livePlacesContext: livePlacesContext,
            });

            /*
                  =========================================
                  GEMINI SUCCESS
                  =========================================
                  */

            console.log("✅ Gemini response generated");

            console.log("========================================");

            return res.json({
                success: true,

                answer: answer,

                sources: {
                    mongodb: Boolean(tourismContext),

                    googlePlaces: livePlaces.length > 0,

                    gemini: true,
                },

                livePlaces: livePlaces,
            });
        } catch (geminiError) {
            /*
                  =========================================
                  GEMINI FAILED
                  =========================================
                  */

            console.error("⚠️ Gemini failed:");

            console.error("Status:", geminiError?.status);

            console.error("Message:", geminiError?.message);

            /*
                  =========================================
                  4. GOOGLE PLACES FALLBACK
                  =========================================
      
                  If Google Places worked but Gemini
                  failed, use Google Places directly.
                  =========================================
                  */

            if (liveSearch && livePlaces.length > 0) {
                console.log("🛟 Using Google Places fallback...");

                const fallbackAnswer = buildLivePlacesFallback(
                    cleanMessage,
                    livePlaces,
                );

                console.log("✅ Fallback answer generated");

                console.log("========================================");

                return res.json({
                    success: true,

                    answer: fallbackAnswer,

                    sources: {
                        mongodb: Boolean(tourismContext),

                        googlePlaces: true,

                        gemini: false,

                        fallback: true,
                    },

                    livePlaces: livePlaces,
                });
            }

            /*
                  =========================================
                  5. NO FALLBACK AVAILABLE
                  =========================================
                  */

            throw geminiError;
        }
    } catch (error) {
        /*
            =============================================
            LOG ERROR
            =============================================
            */

        console.error("========================================");

        console.error("❌ AI CHAT ERROR");

        console.error("Message:", error?.message);

        console.error("Status:", error?.status);

        console.error("Stack:", error?.stack);

        console.error("========================================");

        /*
            =============================================
            GET ERROR STATUS
            =============================================
            */

        const status = Number(error?.status);

        /*
            =============================================
            TEMPORARY / SERVER ERROR
            =============================================
            */

        if (
            status === 429 ||
            status === 500 ||
            status === 502 ||
            status === 503 ||
            status === 504
        ) {
            return res.status(503).json({
                success: false,

                message:
                    "Bharatpur AI is temporarily busy. Please try again in a few seconds.",

                retryable: true,
            });
        }

        /*
            =============================================
            GENERAL ERROR
            =============================================
            */

        return res.status(500).json({
            success: false,

            message: "Sorry, I could not process your request right now.",

            error:
                process.env.NODE_ENV === "development" ? error?.message : undefined,
        });
    }
};
