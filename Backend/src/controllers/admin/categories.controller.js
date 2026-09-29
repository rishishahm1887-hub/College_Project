import Place from "../../models/Place.js";

export const getCategories = async (req, res) => {
    try {
        const result = await Place.aggregate([
            {
                $unwind: "$category",
            },
            {
                $group: {
                    _id: "$category",
                    placeCount: {
                        $sum: 1,
                    },
                },
            },
            {
                $sort: {
                    _id: 1,
                },
            },
        ]);

        const categories = result.map((item) => ({
            name: item._id,
            placeCount: item.placeCount,
        }));

        return res.json({
            success: true,
            categories,
        });
    } catch (error) {
        console.error("Get categories error:", error);

        return res.status(500).json({
            success: false,
            error: "Failed to load categories.",
        });
    }
};

export const createCategory = async (req, res) => {
    try {
        const name = String(req.body.name || "").trim();

        if (!name) {
            return res.status(400).json({
                success: false,
                error: "Category name is required.",
            });
        }

        const existing = await Place.findOne({
            category: {
                $regex: `^${name}$`,
                $options: "i",
            },
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                error: "Category already exists.",
            });
        }

        return res.status(201).json({
            success: true,
            category: {
                name,
                placeCount: 0,
            },
        });
    } catch (error) {
        console.error("Create category error:", error);

        return res.status(500).json({
            success: false,
            error: "Failed to create category.",
        });
    }
};

export const renameCategory = async (req, res) => {
    try {
        const oldName = String(req.params.name || "").trim();
        const newName = String(req.body.name || "").trim();

        if (!oldName || !newName) {
            return res.status(400).json({
                success: false,
                error: "Both category names are required.",
            });
        }

        await Place.updateMany(
            {
                category: oldName,
            },
            {
                $set: {
                    "category.$": newName,
                },
            }
        );

        return res.json({
            success: true,
            message: "Category renamed successfully.",
        });
    } catch (error) {
        console.error("Rename category error:", error);

        return res.status(500).json({
            success: false,
            error: "Failed to rename category.",
        });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        const name = String(req.params.name || "").trim();

        if (!name) {
            return res.status(400).json({
                success: false,
                error: "Category name is required.",
            });
        }

        await Place.updateMany(
            {},
            {
                $pull: {
                    category: name,
                },
            }
        );

        return res.json({
            success: true,
            message: "Category deleted successfully.",
        });
    } catch (error) {
        console.error("Delete category error:", error);

        return res.status(500).json({
            success: false,
            error: "Failed to delete category.",
        });
    }
};