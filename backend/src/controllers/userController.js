
const pool = require("../database/db");
const bcrypt = require("bcrypt");

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, department, phone, role
       FROM users
       WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Profile retrieval error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve profile",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { full_name, department, phone } = req.body;

    if (!full_name || !full_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required",
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET full_name = $1,
           department = $2,
           phone = $3
       WHERE id = $4
       RETURNING id, full_name, email, department, phone, role`,
      [
        full_name.trim(),
        department?.trim() || null,
        phone?.trim() || null,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: result.rows[0],
    });
  } catch (error) {
    console.error("Profile update error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};


const getEmployees = async (req, res) => {
    try {
      const { search = "" } = req.query;
  
      const result = await pool.query(
        `SELECT id, full_name, email, department, phone, role,
                is_active, created_at
         FROM users
         WHERE role = 'EMPLOYEE'
           AND (
             full_name ILIKE $1
             OR email ILIKE $1
             OR COALESCE(department, '') ILIKE $1
           )
         ORDER BY created_at DESC`,
        [`%${search.trim()}%`]
      );
  
      return res.status(200).json({
        success: true,
        employees: result.rows,
      });
    } catch (error) {
      console.error("Error fetching employees:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch employees",
      });
    }
  };
  
  const createEmployee = async (req, res) => {
    try {
      const { full_name, email, password, department, phone } = req.body;
  
      if (!full_name?.trim() || !email?.trim() || !password) {
        return res.status(400).json({
          success: false,
          message: "Name, email, and password are required",
        });
      }
  
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 8 characters",
        });
      }
  
      const passwordHash = await bcrypt.hash(password, 10);
  
      const result = await pool.query(
        `INSERT INTO users
           (full_name, email, password_hash, department, phone, role)
         VALUES ($1, $2, $3, $4, $5, 'EMPLOYEE')
         RETURNING id, full_name, email, department, phone, role,
                   is_active, created_at`,
        [
          full_name.trim(),
          email.trim().toLowerCase(),
          passwordHash,
          department?.trim() || null,
          phone?.trim() || null,
        ]
      );
  
      return res.status(201).json({
        success: true,
        message: "Employee created successfully",
        employee: result.rows[0],
      });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Email is already registered",
        });
      }
  
      console.error("Error creating employee:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to create employee",
      });
    }
  };


const updateEmployee = async (req, res) => {
    try {
      const employeeId = Number(req.params.id);
      const { full_name, email, department, phone } = req.body;
  
      if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }
  
      if (!full_name?.trim() || !email?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name and email are required",
        });
      }
  
      const result = await pool.query(
        `UPDATE users
         SET full_name = $1,
             email = $2,
             department = $3,
             phone = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5 AND role = 'EMPLOYEE'
         RETURNING id, full_name, email, department, phone, role,
                   is_active, created_at`,
        [
          full_name.trim(),
          email.trim().toLowerCase(),
          department?.trim() || null,
          phone?.trim() || null,
          employeeId,
        ]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Employee not found",
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Employee updated successfully",
        employee: result.rows[0],
      });
    } catch (error) {
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message: "Email is already registered",
        });
      }
  
      console.error("Error updating employee:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update employee",
      });
    }
  };


const deactivateEmployee = async (req, res) => {
    try {
      const employeeId = Number(req.params.id);
  
      if (!Number.isInteger(employeeId) || employeeId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid employee ID",
        });
      }
  
      const result = await pool.query(
        `UPDATE users
         SET is_active = FALSE,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
           AND role = 'EMPLOYEE'
           AND is_active = TRUE
         RETURNING id, full_name, email, is_active`,
        [employeeId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Active employee not found",
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Employee deactivated successfully",
        employee: result.rows[0],
      });
    } catch (error) {
      console.error("Error deactivating employee:", error);
  
      return res.status(500).json({
        success: false,
        message: "Failed to deactivate employee",
      });
    }
  };
  
  
  

  module.exports = {
    getProfile,
    updateProfile,
    getEmployees,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
  };