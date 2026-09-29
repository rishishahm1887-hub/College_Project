import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";

import {
    MapPin,
    Search,
    Plus,
    Pencil,
    Trash2,
    X,
    Star,
    Map,
    Navigation,
} from "lucide-react";

import {
    GoogleMap,
    Marker,
    useJsApiLoader,
} from "@react-google-maps/api";

import { apiRequest } from "../lib/api";

/*
==================================================
GOOGLE MAP CONFIGURATION
==================================================
*/

const GOOGLE_MAPS_LIBRARIES = [];

const DEFAULT_CENTER = {
    lat: 27.671,
    lng: 84.432,
};

const MAP_CONTAINER_STYLE = {
    width: "100%",
    height: "350px",
};

/*
==================================================
EMPTY FORM
==================================================
*/

const emptyForm = {
    slug: "",
    name: "",
    location: "",
    formattedAddress: "",
    googlePlaceId: "",

    latitude: "",
    longitude: "",

    description: "",
    image: "",

    rating: 0,
    reviews: 0,

    category: "",

    estimatedCost: 0,
    estimatedVisitMinutes: 15,
};

/*
==================================================
PLACES PAGE
==================================================
*/

const Places = () => {
    const { getToken } = useAuth();

    /*
    ==============================================
    GOOGLE MAP
    ==============================================
    */

    const {
        isLoaded: googleLoaded,
        loadError,
    } = useJsApiLoader({
        googleMapsApiKey:
            import.meta.env
                .VITE_GOOGLE_MAPS_API_KEY,

        libraries:
            GOOGLE_MAPS_LIBRARIES,
    });

    /*
    ==============================================
    STATE
    ==============================================
    */

    const [places, setPlaces] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [search, setSearch] =
        useState("");

    const [modal, setModal] =
        useState(false);

    const [editingId, setEditingId] =
        useState(null);

    const [form, setForm] =
        useState(emptyForm);

    const [saving, setSaving] =
        useState(false);

    /*
    ==============================================
    LOAD PLACES
    ==============================================
    */

    const loadPlaces = async () => {
        try {
            setLoading(true);

            const data =
                await apiRequest(
                    "/admin/places",
                    {},
                    getToken
                );

            setPlaces(
                data.places || []
            );
        } catch (error) {
            console.error(
                "Load places error:",
                error
            );

            alert(
                error.message ||
                "Failed to load places."
            );
        } finally {
            setLoading(false);
        }
    };

    /*
    ==============================================
    INITIAL LOAD
    ==============================================
    */

    useEffect(() => {
        loadPlaces();
    }, []);

    /*
    ==============================================
    OPEN CREATE
    ==============================================
    */

    const openCreate = () => {
        setEditingId(null);

        setForm({
            ...emptyForm,
        });

        setModal(true);
    };

    /*
    ==============================================
    OPEN EDIT
    ==============================================
    */

    const openEdit = (place) => {
        setEditingId(place._id);

        /*
        GeoJSON:
        [longitude, latitude]
        */

        const longitude =
            place.locationPoint
                ?.coordinates?.[0] ??
            place.lng ??
            "";

        const latitude =
            place.locationPoint
                ?.coordinates?.[1] ??
            place.lat ??
            "";

        setForm({
            slug:
                place.slug || "",

            name:
                place.name || "",

            location:
                place.location || "",

            formattedAddress:
                place.formattedAddress ||
                "",

            googlePlaceId:
                place.googlePlaceId ||
                "",

            latitude,

            longitude,

            description:
                place.description ||
                "",

            image:
                place.image || "",

            rating:
                place.rating ?? 0,

            reviews:
                place.reviews ?? 0,

            category:
                Array.isArray(
                    place.category
                )
                    ? place.category.join(
                        ", "
                    )
                    : "",

            estimatedCost:
                place.estimatedCost ??
                0,

            estimatedVisitMinutes:
                place.estimatedVisitMinutes ??
                15,
        });

        setModal(true);
    };

    /*
    ==============================================
    INPUT CHANGE
    ==============================================
    */

    const handleChange = (e) => {
        const {
            name,
            value,
        } = e.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    };

    /*
    ==============================================
    MAP CLICK
    ==============================================
    
    User clicks anywhere on Google Map.
    We only receive coordinates.

    No Places API.
    No Geocoding API.
    ==============================================
    */

    const handleMapClick = (event) => {
        if (!event.latLng) {
            return;
        }

        const latitude =
            event.latLng.lat();

        const longitude =
            event.latLng.lng();

        console.log(
            "Map clicked:",
            {
                latitude,
                longitude,
            }
        );

        setForm((current) => ({
            ...current,

            latitude,

            longitude,
        }));
    };

    /*
    ==============================================
    MARKER DRAG
    ==============================================
    
    User can drag marker to adjust location.
    ==============================================
    */

    const handleMarkerDragEnd = (
        event
    ) => {
        if (!event.latLng) {
            return;
        }

        const latitude =
            event.latLng.lat();

        const longitude =
            event.latLng.lng();

        console.log(
            "Marker moved:",
            {
                latitude,
                longitude,
            }
        );

        setForm((current) => ({
            ...current,

            latitude,

            longitude,
        }));
    };

    /*
    ==============================================
    SAVE PLACE
    ==============================================
    */

    const savePlace = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);

            /*
            ======================================
            LOCATION VALIDATION
            ======================================
            */

            const latitude =
                Number(form.latitude);

            const longitude =
                Number(form.longitude);

            if (
                !Number.isFinite(
                    latitude
                ) ||
                !Number.isFinite(
                    longitude
                )
            ) {
                alert(
                    "Please click on the map to select a location."
                );

                setSaving(false);

                return;
            }

            /*
            ======================================
            NAME VALIDATION
            ======================================
            */

            if (
                !form.name.trim()
            ) {
                alert(
                    "Place name is required."
                );

                setSaving(false);

                return;
            }

            /*
            ======================================
            RATING
            ======================================
            */

            const rating =
                Math.min(
                    5,
                    Math.max(
                        0,
                        Number(
                            form.rating ||
                            0
                        )
                    )
                );

            /*
            ======================================
            VISIT TIME
            ======================================
            */

            const estimatedVisitMinutes =
                Math.max(
                    15,
                    Number(
                        form.estimatedVisitMinutes ||
                        15
                    )
                );

            /*
            ======================================
            CATEGORY
            ======================================
            */

            const categories =
                form.category
                    .split(",")
                    .map(
                        (item) =>
                            item.trim()
                    )
                    .filter(Boolean);

            /*
            ======================================
            SLUG
            ======================================
            */

            const slug =
                form.slug
                    .trim() ||
                form.name
                    .toLowerCase()
                    .trim()
                    .replace(
                        /[^a-z0-9]+/g,
                        "-"
                    )
                    .replace(
                        /^-|-$/g,
                        "");

            /*
            ======================================
            MONGODB PAYLOAD
            ======================================
            
            IMPORTANT:

            GeoJSON coordinates are:

            [longitude, latitude]

            NOT:

            [latitude, longitude]
            ======================================
            */

            const payload = {
                slug,

                name:
                    form.name.trim(),

                location:
                    form.location.trim(),

                formattedAddress:
                    form.formattedAddress.trim(),

                /*
                No Places API means this can
                remain empty.
                */

                googlePlaceId:
                    form.googlePlaceId.trim(),

                description:
                    form.description.trim(),

                image:
                    form.image.trim(),

                rating,

                reviews:
                    Number(
                        form.reviews || 0
                    ),

                category:
                    categories,

                estimatedCost:
                    Number(
                        form.estimatedCost ||
                        0
                    ),

                estimatedVisitMinutes,

                locationPoint: {
                    type: "Point",

                    coordinates: [
                        longitude,
                        latitude,
                    ],
                },
            };

            console.log(
                "PLACE PAYLOAD:",
                payload
            );

            /*
            ======================================
            UPDATE
            ======================================
            */

            if (editingId) {
                await apiRequest(
                    `/admin/places/${editingId}`,
                    {
                        method: "PATCH",

                        body:
                            JSON.stringify(
                                payload
                            ),
                    },
                    getToken
                );
            }

            /*
            ======================================
            CREATE
            ======================================
            */

            else {
                await apiRequest(
                    "/admin/places",
                    {
                        method: "POST",

                        body:
                            JSON.stringify(
                                payload
                            ),
                    },
                    getToken
                );
            }

            /*
            ======================================
            SUCCESS
            ======================================
            */

            setModal(false);

            setEditingId(null);

            setForm({
                ...emptyForm,
            });

            await loadPlaces();
        } catch (error) {
            console.error(
                "Save place error:",
                error
            );

            alert(
                error.message ||
                "Failed to save place."
            );
        } finally {
            setSaving(false);
        }
    };

    /*
    ==============================================
    DELETE
    ==============================================
    */

    const deletePlace = async (id) => {
        if (
            !window.confirm(
                "Delete this place?"
            )
        ) {
            return;
        }

        try {
            await apiRequest(
                `/admin/places/${id}`,
                {
                    method: "DELETE",
                },
                getToken
            );

            await loadPlaces();
        } catch (error) {
            console.error(
                "Delete place error:",
                error
            );

            alert(
                error.message ||
                "Failed to delete place."
            );
        }
    };

    /*
    ==============================================
    SEARCH FILTER
    ==============================================
    */

    const filteredPlaces =
        places.filter((place) => {
            const categories =
                Array.isArray(
                    place.category
                )
                    ? place.category.join(
                        " "
                    )
                    : "";

            return `${place.name || ""} ${place.location || ""
                } ${place.slug || ""} ${categories}`
                .toLowerCase()
                .includes(
                    search.toLowerCase()
                );
        });

    /*
    ==============================================
    MAP CENTER
    ==============================================
    */

    const mapCenter =
        form.latitude &&
            form.longitude
            ? {
                lat: Number(
                    form.latitude
                ),

                lng: Number(
                    form.longitude
                ),
            }
            : DEFAULT_CENTER;

    /*
    ==============================================
    RENDER
    ==============================================
    */

    return (
        <div className="space-y-6">

            {/* =====================================
                HEADER
            ===================================== */}

            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>

                    <h2 className="text-2xl font-bold text-slate-900">
                        Places
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage Bharatpur tourism destinations
                    </p>

                </div>

                <button
                    type="button"
                    onClick={
                        openCreate
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >

                    <Plus size={18} />

                    Add Place

                </button>

            </div>

            {/* =====================================
                SEARCH
            ===================================== */}

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

                <div className="relative max-w-md">

                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        value={
                            search
                        }
                        onChange={(
                            e
                        ) =>
                            setSearch(
                                e.target.value
                            )
                        }
                        placeholder="Search places..."
                        className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                </div>

            </div>

            {/* =====================================
                TABLE
            ===================================== */}

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                {loading ? (

                    <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
                        Loading places...
                    </div>

                ) : filteredPlaces.length ===
                    0 ? (

                    <div className="flex min-h-64 flex-col items-center justify-center">

                        <MapPin
                            size={35}
                            className="mb-3 text-slate-300"
                        />

                        <p className="font-semibold text-slate-700">
                            No places found
                        </p>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full text-left">

                            <thead className="border-b border-slate-200 bg-slate-50">

                                <tr>

                                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">
                                        Place
                                    </th>

                                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">
                                        Category
                                    </th>

                                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">
                                        Rating
                                    </th>

                                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">
                                        Location
                                    </th>

                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-slate-500">
                                        Actions
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {filteredPlaces.map(
                                    (
                                        place
                                    ) => (

                                        <tr
                                            key={
                                                place._id
                                            }
                                            className="hover:bg-slate-50"
                                        >

                                            {/* PLACE */}

                                            <td className="px-6 py-4">

                                                <div className="flex items-center gap-3">

                                                    {place.image ? (

                                                        <img
                                                            src={
                                                                place.image
                                                            }
                                                            alt={
                                                                place.name
                                                            }
                                                            className="h-12 w-12 rounded-lg object-cover"
                                                        />

                                                    ) : (

                                                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50">

                                                            <MapPin
                                                                size={
                                                                    20
                                                                }
                                                                className="text-blue-600"
                                                            />

                                                        </div>

                                                    )}

                                                    <div>

                                                        <p className="font-semibold text-slate-800">
                                                            {
                                                                place.name
                                                            }
                                                        </p>

                                                        <p className="max-w-sm truncate text-xs text-slate-500">
                                                            {place.location ||
                                                                place.formattedAddress ||
                                                                "—"}
                                                        </p>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* CATEGORY */}

                                            <td className="px-6 py-4">

                                                <div className="flex flex-wrap gap-1">

                                                    {place.category?.map(
                                                        (
                                                            category
                                                        ) => (

                                                            <span
                                                                key={
                                                                    category
                                                                }
                                                                className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                                                            >
                                                                {
                                                                    category
                                                                }
                                                            </span>

                                                        )
                                                    )}

                                                </div>

                                            </td>

                                            {/* RATING */}

                                            <td className="px-6 py-4">

                                                <div className="flex items-center gap-1">

                                                    <Star
                                                        size={
                                                            15
                                                        }
                                                        className="fill-amber-400 text-amber-400"
                                                    />

                                                    <span className="font-medium text-slate-700">
                                                        {
                                                            place.rating ??
                                                            0
                                                        }
                                                    </span>

                                                </div>

                                            </td>

                                            {/* LOCATION */}

                                            <td className="px-6 py-4">

                                                {place.locationPoint?.coordinates ? (

                                                    <div className="text-xs text-slate-500">

                                                        <div>
                                                            Lat:{" "}
                                                            {
                                                                place
                                                                    .locationPoint
                                                                    .coordinates[1]
                                                            }
                                                        </div>

                                                        <div>
                                                            Lng:{" "}
                                                            {
                                                                place
                                                                    .locationPoint
                                                                    .coordinates[0]
                                                            }
                                                        </div>

                                                    </div>

                                                ) : (

                                                    <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600">
                                                        No location
                                                    </span>

                                                )}

                                            </td>

                                            {/* ACTIONS */}

                                            <td className="px-6 py-4">

                                                <div className="flex justify-end gap-2">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEdit(
                                                                place
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                                                    >

                                                        <Pencil
                                                            size={
                                                                17
                                                            }
                                                        />

                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deletePlace(
                                                                place._id
                                                            )
                                                        }
                                                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                                                    >

                                                        <Trash2
                                                            size={
                                                                17
                                                            }
                                                        />

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )}

                            </tbody>

                        </table>

                    </div>

                )}

            </div>

            {/* =====================================
                ADD / EDIT MODAL
            ===================================== */}

            {modal && (

                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

                    <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

                        {/* MODAL HEADER */}

                        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">

                            <div>

                                <h3 className="text-lg font-bold text-slate-900">

                                    {editingId
                                        ? "Edit Place"
                                        : "Add Place"}

                                </h3>

                                <p className="mt-1 text-xs text-slate-500">

                                    Click anywhere on the map to select the location.

                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setModal(
                                        false
                                    )
                                }
                                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                            >

                                <X
                                    size={20}
                                />

                            </button>

                        </div>

                        {/* FORM */}

                        <form
                            onSubmit={
                                savePlace
                            }
                            className="space-y-6 p-6"
                        >

                            {/* =================================
                                MAP SECTION
                            ================================= */}

                            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">

                                <div className="mb-4 flex items-center gap-3">

                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">

                                        <Map
                                            size={
                                                20
                                            }
                                            className="text-blue-600"
                                        />

                                    </div>

                                    <div>

                                        <h4 className="font-semibold text-slate-800">
                                            Select Location
                                        </h4>

                                        <p className="text-xs text-slate-500">
                                            Click on the map or drag the marker to set the exact location.
                                        </p>

                                    </div>

                                </div>

                                {/* MAP */}

                                {loadError ? (

                                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                                        Google Maps could not
                                        be loaded.

                                        <br />

                                        Make sure your Google
                                        API key has the
                                        <strong>
                                            {" "}
                                            Maps JavaScript API
                                        </strong>{" "}
                                        enabled.

                                    </div>

                                ) : !googleLoaded ? (

                                    <div className="flex h-[350px] items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">

                                        Loading Google Maps...

                                    </div>

                                ) : (

                                    <div className="overflow-hidden rounded-lg border border-slate-300">

                                        <GoogleMap
                                            mapContainerStyle={
                                                MAP_CONTAINER_STYLE
                                            }
                                            center={
                                                mapCenter
                                            }
                                            zoom={
                                                form.latitude &&
                                                    form.longitude
                                                    ? 16
                                                    : 13
                                            }
                                            onClick={
                                                handleMapClick
                                            }
                                            options={{
                                                streetViewControl:
                                                    false,

                                                mapTypeControl:
                                                    true,

                                                fullscreenControl:
                                                    true,

                                                clickableIcons:
                                                    false,
                                            }}
                                        >

                                            {form.latitude &&
                                                form.longitude && (

                                                    <Marker
                                                        position={{
                                                            lat: Number(
                                                                form.latitude
                                                            ),

                                                            lng: Number(
                                                                form.longitude
                                                            ),
                                                        }}
                                                        draggable={
                                                            true
                                                        }
                                                        onDragEnd={
                                                            handleMarkerDragEnd
                                                        }
                                                    />

                                                )}

                                        </GoogleMap>

                                    </div>

                                )}

                                {/* =================================
                                    MAP INSTRUCTIONS
                                ================================= */}

                                <div className="mt-3 flex items-start gap-2 rounded-lg bg-white p-3">

                                    <Navigation
                                        size={
                                            17
                                        }
                                        className="mt-0.5 shrink-0 text-blue-600"
                                    />

                                    <div className="text-xs text-slate-600">

                                        <p className="font-medium text-slate-700">
                                            How to select:
                                        </p>

                                        <p className="mt-1">
                                            Click on the exact
                                            location on the map.
                                            A marker will appear.
                                            You can drag the marker
                                            to fine-tune the
                                            position.
                                        </p>

                                    </div>

                                </div>

                            </div>

                            {/* =================================
                                SELECTED COORDINATES
                            ================================= */}

                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

                                <h4 className="mb-4 text-sm font-semibold text-slate-800">
                                    Selected Location
                                </h4>

                                <div className="grid gap-4 sm:grid-cols-2">

                                    {/* LATITUDE */}

                                    <div>

                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Latitude
                                        </label>

                                        <input
                                            value={
                                                form.latitude
                                            }
                                            readOnly
                                            placeholder="Click map"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
                                        />

                                    </div>

                                    {/* LONGITUDE */}

                                    <div>

                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Longitude
                                        </label>

                                        <input
                                            value={
                                                form.longitude
                                            }
                                            readOnly
                                            placeholder="Click map"
                                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
                                        />

                                    </div>

                                </div>

                                {/* COORDINATE STATUS */}

                                {form.latitude &&
                                    form.longitude ? (

                                    <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-700">

                                        ✓ Location selected successfully

                                    </div>

                                ) : (

                                    <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">

                                        Please click on the map to
                                        select a location.

                                    </div>

                                )}

                            </div>

                            {/* =================================
                                BASIC INFORMATION
                            ================================= */}

                            <div>

                                <h4 className="mb-4 text-sm font-semibold text-slate-800">
                                    Basic Information
                                </h4>

                                <div className="grid gap-4 sm:grid-cols-2">

                                    {/* NAME */}

                                    <div>

                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Place Name
                                        </label>

                                        <input
                                            name="name"
                                            value={
                                                form.name
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            required
                                            placeholder="Sauraha"
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                    {/* SLUG */}

                                    <div>

                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Slug
                                        </label>

                                        <input
                                            name="slug"
                                            value={
                                                form.slug
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="sauraha"
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                    {/* LOCATION */}

                                    <div>

                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Location
                                        </label>

                                        <input
                                            name="location"
                                            value={
                                                form.location
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Sauraha, Chitwan"
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                    {/* ADDRESS */}

                                    <div>

                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Formatted Address
                                        </label>

                                        <input
                                            name="formattedAddress"
                                            value={
                                                form.formattedAddress
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Sauraha, Chitwan, Nepal"
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                </div>

                            </div>

                            {/* =================================
                                PLACE DETAILS
                            ================================= */}

                            <div>

                                <h4 className="mb-4 text-sm font-semibold text-slate-800">
                                    Place Details
                                </h4>

                                <div className="grid gap-4 sm:grid-cols-2">

                                    {/* CATEGORY */}

                                    <div>

                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Categories
                                        </label>

                                        <input
                                            name="category"
                                            value={
                                                form.category
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="Nature, Temple, Wildlife"
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                        <p className="mt-1 text-xs text-slate-400">
                                            Separate categories with commas.
                                        </p>

                                    </div>

                                    {/* IMAGE */}

                                    <div>

                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Image URL
                                        </label>

                                        <input
                                            name="image"
                                            value={
                                                form.image
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            placeholder="https://..."
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                    {/* COST */}

                                    <div>

                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Estimated Cost
                                        </label>

                                        <input
                                            name="estimatedCost"
                                            type="number"
                                            min="0"
                                            value={
                                                form.estimatedCost
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                    {/* VISIT TIME */}

                                    <div>

                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Visit Minutes
                                        </label>

                                        <input
                                            name="estimatedVisitMinutes"
                                            type="number"
                                            min="15"
                                            value={
                                                form.estimatedVisitMinutes
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                        <p className="mt-1 text-xs text-slate-400">
                                            Minimum 15 minutes.
                                        </p>

                                    </div>

                                    {/* RATING */}

                                    <div>

                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Rating
                                        </label>

                                        <input
                                            name="rating"
                                            type="number"
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            value={
                                                form.rating
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                        <p className="mt-1 text-xs text-slate-400">
                                            0 to 5.
                                        </p>

                                    </div>

                                    {/* REVIEWS */}

                                    <div>

                                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                            Review Count
                                        </label>

                                        <input
                                            name="reviews"
                                            type="number"
                                            min="0"
                                            value={
                                                form.reviews
                                            }
                                            onChange={
                                                handleChange
                                            }
                                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                </div>

                            </div>

                            {/* =================================
                                DESCRIPTION
                            ================================= */}

                            <div>

                                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                    Description
                                </label>

                                <textarea
                                    name="description"
                                    value={
                                        form.description
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    rows={5}
                                    placeholder="Describe this tourism destination..."
                                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />

                            </div>

                            {/* =================================
                                ACTIONS
                            ================================= */}

                            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">

                                <button
                                    type="button"
                                    onClick={() =>
                                        setModal(
                                            false
                                        )
                                    }
                                    disabled={
                                        saving
                                    }
                                    className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        saving ||
                                        !form.latitude ||
                                        !form.longitude
                                    }
                                    className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Update Place"
                                            : "Create Place"}
                                </button>

                            </div>

                        </form>

                    </div>

                </div>

            )}

        </div>
    );
};

export default Places;