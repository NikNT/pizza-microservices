import express from "express";

const router = express.Router();

// Routes
router.post("/", (req, res) => {
  res.status(201).json({});
});
export default router;
