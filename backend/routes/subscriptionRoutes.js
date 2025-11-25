import express from "express";
import Subscription from "../models/Subscription.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET all for user
router.get("/", protect, async (req, res) => {
  const subs = await Subscription.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(subs);
});

// ADD
router.post("/", protect, async (req, res) => {
  const { name, cost, category, renewalDate, currency } = req.body;
  const sub = await Subscription.create({
    user: req.user._id,
    name,
    cost,
    category,
    renewalDate,
    currency,
  });
  res.json(sub);
});

// UPDATE (This is the new feature)
router.put("/:id", protect, async (req, res) => {
  const { name, cost, category, renewalDate, currency } = req.body;
  
  const sub = await Subscription.findOne({ _id: req.params.id, user: req.user._id });
  if (!sub) return res.status(404).json({ message: "Subscription not found" });

  sub.name = name;
  sub.cost = cost;
  sub.category = category;
  sub.renewalDate = renewalDate;
  sub.currency = currency;

  const updatedSub = await sub.save();
  res.json(updatedSub);
});


// DELETE
router.delete("/:id", protect, async (req, res) => {
  const sub = await Subscription.findOne({ _id: req.params.id, user: req.user._id });
  if (!sub) return res.status(404).json({ message: "Subscription not found" });
  
  await sub.deleteOne(); // Use deleteOne() instead of remove()
  res.json({ message: "Deleted" });
});

export default router;
