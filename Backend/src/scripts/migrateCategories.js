import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import Category from "../models/Category.js";

const MONGO_URI =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI;

const createSlug = (name) => {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

const run = async () => {
    try {
        if (!MONGO_URI) {
            throw new Error(
                "MongoDB connection string not found."
            );
        }

        await mongoose.connect(
            MONGO_URI
        );

        console.log(
            "MongoDB connected."
        );

        const db =
            mongoose.connection.db;

        const placesCollection =
            db.collection("places");

        const places =
            await placesCollection
                .find({})
                .toArray();

        console.log(
            `Found ${places.length} places.`
        );

        const categoryMap =
            new Map();

        /*
        =================================================
        COLLECT OLD CATEGORY NAMES
        =================================================
        */

        for (
            const place of places
        ) {
            if (
                !Array.isArray(
                    place.category
                )
            ) {
                continue;
            }

            for (
                const value of place.category
            ) {
                if (
                    typeof value ===
                    "string"
                ) {
                    const name =
                        value.trim();

                    if (name) {
                        categoryMap.set(
                            name.toLowerCase(),
                            name
                        );
                    }
                }
            }
        }

        console.log(
            `Found ${categoryMap.size} old categories.`
        );

        /*
        =================================================
        CREATE CATEGORY DOCUMENTS
        =================================================
        */

        const categoryIds =
            new Map();

        for (
            const name of
            categoryMap.values()
        ) {
            const slug =
                createSlug(name);

            let category =
                await Category.findOne({
                    $or: [
                        {
                            name: {
                                $regex: `^${name}$`,
                                $options:
                                    "i",
                            },
                        },
                        {
                            slug,
                        },
                    ],
                });

            if (!category) {
                category =
                    await Category.create(
                        {
                            name,
                            slug,
                        }
                    );

                console.log(
                    `Created category: ${name}`
                );
            } else {
                console.log(
                    `Category already exists: ${name}`
                );
            }

            categoryIds.set(
                name.toLowerCase(),
                category._id
            );
        }

        /*
        =================================================
        UPDATE PLACES
        =================================================
        */

        let updated = 0;

        for (
            const place of places
        ) {
            if (
                !Array.isArray(
                    place.category
                )
            ) {
                continue;
            }

            const oldCategories =
                place.category;

            const newCategories =
                [];

            for (
                const value of
                oldCategories
            ) {
                if (
                    typeof value ===
                    "string"
                ) {
                    const categoryId =
                        categoryIds.get(
                            value
                                .trim()
                                .toLowerCase()
                        );

                    if (
                        categoryId
                    ) {
                        newCategories.push(
                            categoryId
                        );
                    }
                } else if (
                    value &&
                    typeof value ===
                    "object"
                ) {
                    newCategories.push(
                        value
                    );
                }
            }

            await placesCollection.updateOne(
                {
                    _id: place._id,
                },
                {
                    $set: {
                        category:
                            newCategories,
                    },
                }
            );

            updated++;
        }

        console.log(
            `Updated ${updated} places.`
        );

        console.log(
            "Category migration completed successfully."
        );

        await mongoose.disconnect();
    } catch (error) {
        console.error(
            "Migration failed:",
            error
        );

        await mongoose.disconnect();

        process.exit(1);
    }
};

run();