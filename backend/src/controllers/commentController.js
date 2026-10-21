const pool = require("../database/db");

const addComment = async (req, res) => {
  try {
    const claimId = req.params.id;
    const userId = req.user.id;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({
        message: "Comment cannot be empty",
      });
    }

    const isAdmin = req.user.role === "ADMIN";

    const claimResult = await pool.query(
      isAdmin
        ? "SELECT id FROM claims WHERE id = $1"
        : "SELECT id FROM claims WHERE id = $1 AND user_id = $2",
      isAdmin ? [claimId] : [claimId, userId]
    );

    if (claimResult.rows.length === 0) {
      return res.status(404).json({
        message: "Claim not found",
      });
    }

    const result = await pool.query(
      `INSERT INTO comments (claim_id, user_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [claimId, userId, comment.trim()]
    );

    return res.status(201).json({
      message: "Comment added successfully",
      comment: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    return res.status(500).json({
      message: "Failed to add comment",
    });
  }
};
const getComments = async (req, res) => {
    try {
      const claimId = req.params.id;
      const userId = req.user.id;
  
      const isAdmin = req.user.role === "ADMIN";

      const claimResult = await pool.query(
        isAdmin
          ? "SELECT id FROM claims WHERE id = $1"
          : "SELECT id FROM claims WHERE id = $1 AND user_id = $2",
        isAdmin ? [claimId] : [claimId, userId]
      );
  
      if (claimResult.rows.length === 0) {
        return res.status(404).json({
          message: "Claim not found",
        });
      }
  
      const result = await pool.query(
        `SELECT
           comments.id,
           comments.claim_id,
           comments.user_id,
           comments.message,
           comments.created_at,
           users.full_name
         FROM comments
         JOIN users ON comments.user_id = users.id
         WHERE comments.claim_id = $1
         ORDER BY comments.created_at ASC`,
        [claimId]
      );
  
      return res.status(200).json({
        comments: result.rows,
      });
    } catch (error) {
      console.error("Error fetching comments:", error);
      return res.status(500).json({
        message: "Failed to fetch comments",
      });
    }
  };
module.exports = {
    addComment,
    getComments,
  };