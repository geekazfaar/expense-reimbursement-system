
const pool = require("../database/db");

const getCategories = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, description
       FROM categories
       WHERE is_active = TRUE
       ORDER BY name ASC`
    );

    res.status(200).json({
      categories: result.rows,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      message: "Failed to fetch categories",
    });
  }
};


const createCategory = async (req, res) => {
    const { name, description, annual_budget } = req.body;
  
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      (description != null && typeof description !== "string") ||
      (annual_budget !== undefined &&
        (!Number.isFinite(Number(annual_budget)) ||
          Number(annual_budget) <= 0))
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid category name, description and budget",
      });
    }
  
    try {
      const result = await pool.query(
        `INSERT INTO categories (name, description)
         VALUES ($1, $2)
         RETURNING id, name, description, is_active`,
        [name.trim(), description?.trim() || null]
      );
  
      return res.status(201).json({
        success: true,
        message: "Category created successfully",
        category: result.rows[0],
      });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "A category with this name already exists",
        });
      }
  
      console.error("Create category error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create category",
      });
    }
  };
  
  const updateCategory = async (req, res) => {
    const { name, description } = req.body;
    const categoryId = Number(req.params.id);
  
    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0 ||
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      (description != null && typeof description !== "string")
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid category ID, name and description",
      });
    }
  
    try {
      const result = await pool.query(
        `UPDATE categories
         SET name = $1,
             description = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND is_active = TRUE
         RETURNING id, name, description, is_active`,
        [name.trim(), description?.trim() || null, categoryId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Active category not found",
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Category updated successfully",
        category: result.rows[0],
      });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "A category with this name already exists",
        });
      }
  
      console.error("Update category error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update category",
      });
    }
  };
  
  module.exports = {
    getCategories,
    createCategory,
    updateCategory,
  };
