
const pool = require("../database/db");


const setBudget = async (req, res) => {
    const { category_id, budget_year, annual_limit } = req.body;
  
    if (
      !Number.isInteger(Number(category_id)) ||
      Number(category_id) <= 0 ||
      !Number.isInteger(Number(budget_year)) ||
      Number(budget_year) < 2000 ||
      Number(budget_year) > 2100 ||
      annual_limit === undefined ||
      annual_limit === null ||
      annual_limit === "" ||
      !Number.isFinite(Number(annual_limit)) ||
      Number(annual_limit) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid category, year and positive budget limit",
      });
    }
  
    try {
      const category = await pool.query(
        "SELECT id FROM categories WHERE id = $1 AND is_active = TRUE",
        [Number(category_id)]
      );
  
      if (category.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Active category not found",
        });
      }
  
      const result = await pool.query(
        `INSERT INTO category_annual_budgets
           (category_id, budget_year, annual_limit)
         VALUES ($1, $2, $3)
         ON CONFLICT (category_id, budget_year)
         DO UPDATE SET
           annual_limit = EXCLUDED.annual_limit,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [
          Number(category_id),
          Number(budget_year),
          Number(annual_limit),
        ]
      );
  
      return res.status(200).json({
        success: true,
        message: "Category annual budget saved successfully",
        budget: result.rows[0],
      });
    } catch (error) {
      console.error("Set budget error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to save category annual budget",
      });
    }
  };
  

  const getBudgets = async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT
          b.id,
          b.category_id,
          c.name AS category_name,
          b.budget_year,
          b.annual_limit,
          COALESCE(
            SUM(cl.total_amount) FILTER (
              WHERE cl.status = 'APPROVED'
            ),
            0
          ) AS total_approved_amount
        FROM category_annual_budgets b
        JOIN categories c ON c.id = b.category_id
        LEFT JOIN claims cl
          ON cl.category_id = b.category_id
          AND EXTRACT(YEAR FROM cl.expense_date) = b.budget_year
        GROUP BY
          b.id,
          b.category_id,
          c.name,
          b.budget_year,
          b.annual_limit
        ORDER BY b.budget_year DESC, c.name ASC
      `);
  
      const budgets = result.rows.map((budget) => ({
        ...budget,
        annual_limit: Number(budget.annual_limit),
        total_approved_amount: Number(budget.total_approved_amount),
      }));
  
      return res.status(200).json({
        success: true,
        budgets,
      });
    } catch (error) {
      console.error("Get budgets error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch category budgets",
      });
    }
  };
  

module.exports = { setBudget, getBudgets };
