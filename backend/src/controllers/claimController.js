
const pool = require("../database/db");


const createClaim = async (req, res) => {
    const client = await pool.connect();
  
    try {
      const {
        category_id,
        expense_date,
        quantity,
        unit_price,
        description,
      } = req.body;
  
      const user_id = req.user.id;
  
      if (
        !category_id ||
        !expense_date ||
        quantity === undefined ||
        quantity === null ||
        quantity === "" ||
        unit_price === undefined ||
        unit_price === null ||
        unit_price === "" ||
        typeof description !== "string" ||
        !description.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "All fields are required",
        });
      }
  
      const categoryId = Number(category_id);
      const qty = Number(quantity);
      const price = Number(unit_price);
  
      if (
        !Number.isInteger(categoryId) ||
        categoryId <= 0 ||
        !Number.isFinite(qty) ||
        !Number.isFinite(price) ||
        qty <= 0 ||
        price <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Category must be valid and quantity and unit price must be positive numbers",
        });
      }
  
     
      if (
        typeof expense_date !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(expense_date)
      ) {
        return res.status(400).json({
          success: false,
          message: "Provide a valid expense date",
        });
      }
  

      const dateCheck = await pool.query(
        "SELECT $1::date::text AS expense_date, CURRENT_DATE::text AS today",
        [expense_date]
      );
      
      const parsedDate = dateCheck.rows[0].expense_date;
      const today = dateCheck.rows[0].today;
      
      if (!parsedDate || parsedDate !== expense_date || expense_date > today) {
        return res.status(400).json({
          success: false,
          message: "Expense date must be a valid date and cannot be in the future",
        });
      }
      
  
      const total_amount = qty * price;
  
      if (!Number.isFinite(total_amount) || total_amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Total amount must be a valid positive number",
        });
      }
  
      const budgetYear = Number(expense_date.slice(0, 4));
  
      await client.query("BEGIN");
  

      const budgetResult = await client.query(
        `SELECT annual_limit
         FROM category_annual_budgets
         WHERE category_id = $1
           AND budget_year = $2
         FOR UPDATE`,
        [categoryId, budgetYear]
      );
  
      if (budgetResult.rows.length === 0) {
        await client.query("ROLLBACK");
  
        return res.status(400).json({
          success: false,
          message: "No budget configured for this category and year",
        });
      }
  
      const budget = budgetResult.rows[0];
  
     
      const spentResult = await client.query(
        `SELECT COALESCE(SUM(total_amount), 0) AS spent
         FROM claims
         WHERE user_id = $1
           AND category_id = $2
           AND status = 'APPROVED'
           AND EXTRACT(YEAR FROM expense_date) = $3`,
        [user_id, categoryId, budgetYear]
      );
  
      const remaining =
        Number(budget.annual_limit) - Number(spentResult.rows[0].spent);
  
      if (total_amount > remaining) {
        await client.query("ROLLBACK");
  
        return res.status(400).json({
          success: false,
          message: "Claim exceeds your remaining annual category budget",
          remainingBudget: remaining,
        });
      }
  
      const result = await client.query(
        `INSERT INTO claims
           (user_id, category_id, expense_date, quantity,
            unit_price, total_amount, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          user_id,
          categoryId,
          expense_date,
          qty,
          price,
          total_amount,
          description.trim(),
        ]
      );

      const files = req.files || [];

for (const file of files) {

    await client.query(
        `INSERT INTO attachments
           (claim_id, original_name, stored_name, file_path, mime_type, file_size, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          result.rows[0].id,
          file.originalname,
          file.filename,
          file.path,
          file.mimetype,
          file.size,
          user_id,
        ]
      );
      
}
  
      await client.query("COMMIT");
  
      return res.status(201).json({
        success: true,
        message: "Expense claim created successfully",
        claim: result.rows[0],
        remainingBudget: remaining,
      });
    } catch (error) {
      await client.query("ROLLBACK");
  
      console.error("Error creating claim:", error);
  
      return res.status(500).json({
        success: false,
        message: "Failed to create expense claim",
      });
    } finally {
      client.release();
    }
  };
  

const getMyClaims = async (req, res) => {
    try {
      const userId = req.user.id;
  
      
const result = await pool.query(
    `SELECT
       claims.id,
       claims.expense_date,
       claims.quantity,
       claims.unit_price,
       claims.total_amount,
       claims.description,
       claims.status,
       claims.created_at,
       categories.name AS category_name,
       COALESCE(
         json_agg(
           json_build_object(
             'id', attachments.id,
             'original_name', attachments.original_name
           )
         ) FILTER (WHERE attachments.id IS NOT NULL),
         '[]'
       ) AS attachments
     FROM claims
     JOIN categories
       ON claims.category_id = categories.id
     LEFT JOIN attachments
       ON attachments.claim_id = claims.id
     WHERE claims.user_id = $1
     GROUP BY claims.id, categories.name
     ORDER BY claims.created_at DESC`,
    [userId]
  );
  
  
      return res.status(200).json({
        claims: result.rows,
      });
    } catch (error) {
      console.error("Error fetching claims:", error);
  
      return res.status(500).json({
        message: "Failed to fetch expense claims",
      });
    }
  };
  
  const cancelClaim = async (req, res) => {
    try {
      const claimId = req.params.id;
      const userId = req.user.id;
  
      const result = await pool.query(
        `UPDATE claims
         SET status = 'CANCELLED',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
           AND user_id = $2
           AND status = 'PENDING'
         RETURNING *`,
        [claimId, userId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Claim not found or cannot be cancelled",
        });
      }
  
      return res.status(200).json({
        message: "Expense claim cancelled successfully",
        claim: result.rows[0],
      });
    } catch (error) {
      console.error("Error cancelling claim:", error);
      return res.status(500).json({
        message: "Failed to cancel expense claim",
      });
    }
  };

  const getAllClaims = async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          c.*,
          cat.name AS category_name,
          u.full_name AS employee_name,
          u.email AS employee_email,
          u.department
        FROM claims c
        JOIN categories cat ON cat.id = c.category_id
        JOIN users u ON u.id = c.user_id
        ORDER BY c.created_at DESC
      `);
  
      return res.status(200).json({
        success: true,
        claims: result.rows,
      });
    } catch (error) {
      console.error("Get all claims error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch claims",
      });
    }
  };


  const approveClaim = async (req, res) => {
    const client = await pool.connect();
  
    try {
      await client.query("BEGIN");
  
      const claimResult = await client.query(
        `SELECT id, user_id, category_id, expense_date,
                total_amount, status
         FROM claims
         WHERE id = $1
         FOR UPDATE`,
        [req.params.id]
      );
  
      if (claimResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({
          success: false,
          message: "Claim not found",
        });
      }
  
      const claim = claimResult.rows[0];
  
      if (claim.status !== "PENDING") {
        await client.query("ROLLBACK");
        return res.status(409).json({
          success: false,
          message: "Only pending claims can be approved",
        });
      }
  
      const budgetYear = new Date(claim.expense_date).getUTCFullYear();
  
      // Lock the common category budget for this year.
      const budgetResult = await client.query(
        `SELECT id, annual_limit
         FROM category_annual_budgets
         WHERE category_id = $1
           AND budget_year = $2
         FOR UPDATE`,
        [claim.category_id, budgetYear]
      );
  
      if (budgetResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "No budget configured for this category and year",
        });
      }
  
      const budget = budgetResult.rows[0];
  
      // Count only this employee's approved claims.
      const spentResult = await client.query(
        `SELECT COALESCE(SUM(total_amount), 0) AS spent
         FROM claims
         WHERE user_id = $1
           AND category_id = $2
           AND status = 'APPROVED'
           AND EXTRACT(YEAR FROM expense_date) = $3`,
        [claim.user_id, claim.category_id, budgetYear]
      );
  
      const remaining =
        Number(budget.annual_limit) -
        Number(spentResult.rows[0].spent);
  
      if (Number(claim.total_amount) > remaining) {
        await client.query("ROLLBACK");
  
        return res.status(400).json({
          success: false,
          message: "Insufficient remaining budget to approve this claim",
          remainingBudget: remaining,
        });
      }
  
      const updatedResult = await client.query(
        `UPDATE claims
         SET status = 'APPROVED',
             reviewed_by = $1,
             reviewed_at = CURRENT_TIMESTAMP,
             rejection_reason = NULL,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND status = 'PENDING'
         RETURNING *`,
        [req.user.id, claim.id]
      );
  
      await client.query("COMMIT");
  
      return res.status(200).json({
        success: true,
        message: "Claim approved successfully",
        claim: updatedResult.rows[0],
        remainingBudget: remaining - Number(claim.total_amount),
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Approve claim error:", error);
  
      return res.status(500).json({
        success: false,
        message: "Failed to approve claim",
      });
    } finally {
      client.release();
    }
  };
  

  const rejectClaim = async (req, res) => {
    const reason =
      typeof req.body.reason === "string" ? req.body.reason.trim() : "";
  
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "A rejection reason is required",
      });
    }
  
    try {
      const result = await pool.query(
        `UPDATE claims
         SET status = 'REJECTED',
             rejection_reason = $1,
             reviewed_by = $2,
             reviewed_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND status = 'PENDING'
         RETURNING *`,
        [reason, req.user.id, req.params.id]
      );
  
      if (result.rows.length === 0) {
        const existing = await pool.query(
          "SELECT id FROM claims WHERE id = $1",
          [req.params.id]
        );
  
        return res.status(existing.rows.length ? 409 : 404).json({
          success: false,
          message: existing.rows.length
            ? "Only pending claims can be rejected"
            : "Claim not found",
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Claim rejected successfully",
        claim: result.rows[0],
      });
    } catch (error) {
      console.error("Reject claim error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to reject claim",
      });
    }
  };


const getReceipt = async (req, res) => {
    try {
      const attachmentId = Number(req.params.attachmentId);
      const userId = req.user.id;
      const isAdmin = req.user.role === "ADMIN";
  
      if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid attachment ID",
        });
      }
  
      const result = await pool.query(
        `SELECT a.file_path, a.original_name, c.user_id
         FROM attachments a
         JOIN claims c ON c.id = a.claim_id
         WHERE a.id = $1`,
        [attachmentId]
      );
  
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Receipt not found",
        });
      }
  
      const receipt = result.rows[0];
  
      if (!isAdmin && Number(receipt.user_id) !== Number(userId)) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to access this receipt",
        });
      }
  
      return res.download(receipt.file_path, receipt.original_name);
    } catch (error) {
      console.error("Error retrieving receipt:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve receipt",
      });
    }
  };
  

  module.exports = {
    createClaim,
    getMyClaims,
    cancelClaim,
    getAllClaims,
    approveClaim,
    rejectClaim,
    getReceipt,
  };