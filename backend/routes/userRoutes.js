import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Subscription from "../models/Subscription.js";

const router = express.Router();

// Get user profile (including budget)
router.get("/me", protect, async (req, res) => {
  res.json({ id: req.user._id, email: req.user.email, name: req.user.name, budget: req.user.budget });
});

// Update budget
router.put("/budget", protect, async (req, res) => {
  const { budget } = req.body;
  if (budget === null || budget === undefined || budget < 0) {
    return res.status(400).json({ message: "Invalid budget amount" });
  }
  req.user.budget = budget;
  await req.user.save();
  res.json({ budget: req.user.budget });
});

// Monthly summary (subscriptions total this month)
router.get("/summary/monthly", protect, async (req, res) => {
  // For simplicity, assume all subscriptions recur monthly and count all.
  const subs = await Subscription.find({ user: req.user._id });
  const total = subs.reduce((acc, s) => acc + Number(s.cost || 0), 0);
  
  // breakdown by category
  const byCategory = {};
  subs.forEach((s) => {
    const cat = s.category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + s.cost;
  });
  res.json({ total, byCategory, budget: req.user.budget });
});

export default router;
