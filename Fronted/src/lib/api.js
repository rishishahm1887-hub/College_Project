const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";


/*
=========================================================
API REQUEST
=========================================================
*/

const apiRequest = async (
  endpoint,
  options = {}
) => {
  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,

        headers: {
          ...(options.body
            ? {
              "Content-Type":
                "application/json",
            }
            : {}),

          ...(options.headers || {}),
        },
      }
    );


  let data = null;


  try {
    data =
      await response.json();
  } catch {
    data = null;
  }


  if (!response.ok) {
    throw new Error(
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`
    );
  }


  return data;
};


/*
=========================================================
PUBLIC PLACES
=========================================================
*/

export const getPlaces =
  async () => {
    return apiRequest(
      "/places",
      {
        method: "GET",
      }
    );
  };


/*
=========================================================
RESOLVE PLACE
=========================================================
*/

export const resolvePlace =
  async (
    name,
    token
  ) => {
    return apiRequest(
      "/places/resolve",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({
          name,
        }),
      }
    );
  };


/*
=========================================================
ADD TO MY TRIP
=========================================================
*/

export const addMyTrip =
  async (
    placeId,
    token
  ) => {
    return apiRequest(
      "/trips",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({
          placeId,
        }),
      }
    );
  };


/*
=========================================================
GET MY TRIPS
=========================================================
*/

export const getMyTrips =
  async (
    token
  ) => {
    return apiRequest(
      "/trips",
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );
  };


/*
=========================================================
REMOVE MY TRIP
=========================================================
*/

export const removeMyTrip =
  async (
    placeId,
    token
  ) => {
    if (!placeId) {
      throw new Error(
        "Place ID is required."
      );
    }

    return apiRequest(
      `/trips/${placeId}`,
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );
  };


/*
=========================================================
CLEAR MY TRIPS
=========================================================
*/

export const clearMyTrips =
  async (
    token
  ) => {
    return apiRequest(
      "/trips",
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );
  };


/*
=========================================================
GENERATE MY TRIP
=========================================================
*/

export const generateMyTrip =
  async (
    tripData,
    token
  ) => {
    return apiRequest(
      "/planner/generate",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify(
          tripData
        ),
      }
    );
  };


/*
=========================================================
GET GENERATED TRIPS
=========================================================
*/

export const getGeneratedTrips =
  async (
    token
  ) => {
    return apiRequest(
      "/planner/history",
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );
  };


/*
=========================================================
GET SINGLE GENERATED TRIP
=========================================================
*/

export const getGeneratedTrip =
  async (
    tripId,
    token
  ) => {
    return apiRequest(
      `/planner/${tripId}`,
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );
  };


/*
=========================================================
GET MY REVIEWS
=========================================================
*/

export const getTripReviews =
  async (
    token
  ) => {
    return apiRequest(
      "/reviews",
      {
        method: "GET",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );
  };


/*
=========================================================
GET PUBLIC REVIEWS
=========================================================
*/

export const getPublicTripReviews =
  async () => {
    return apiRequest(
      "/reviews/public",
      {
        method: "GET",
      }
    );
  };


/*
=========================================================
SUBMIT REVIEW
=========================================================
*/

export const submitTripReview =
  async (
    tripId,
    rating,
    review,
    token
  ) => {
    return apiRequest(
      "/reviews",
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },

        body: JSON.stringify({
          tripId,
          rating,
          review,
        }),
      }
    );
  };


/*
=========================================================
DELETE REVIEW
=========================================================
*/

export const deleteTripReview =
  async (
    tripId,
    token
  ) => {
    return apiRequest(
      `/reviews/${tripId}`,
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );
  };


/*
=========================================================
AI CHAT
=========================================================
*/

export const sendAIChat =
  async (
    message,
    history = [],
    token = null
  ) => {
    const headers = {};


    if (token) {
      headers.Authorization =
        `Bearer ${token}`;
    }


    return apiRequest(
      "/ai/chat",
      {
        method: "POST",

        headers,

        body: JSON.stringify({
          message,
          history,
        }),
      }
    );
  };