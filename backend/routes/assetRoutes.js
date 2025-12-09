import express from "express";
import Asset from "../models/Asset.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  const assets = await Asset.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(assets);
});

router.post("/", protect, async (req, res) => {
  const { name, value, purchaseDate, category } = req.body;
  const asset = await Asset.create({
    user: req.user._id,
    name,
    value,
    purchaseDate,
    category,
  });
  res.json(asset);
});

router.put("/:id", protect, async (req, res) => {
  const { name, value, purchaseDate, category } = req.body;
  const asset = await Asset.findOne({ _id: req.params.id, user: req.user._id });
  if (!asset) return res.status(404).json({ message: "Asset not found" });

  asset.name = name;
  asset.value = value;
  asset.purchaseDate = purchaseDate;
  asset.category = category;

  const updatedAsset = await asset.save();
  res.json(updatedAsset);
});

router.delete("/:id", protect, async (req, res) => {
  const asset = await Asset.findOne({ _id: req.params.id, user: req.user._id });
  if (!asset) return res.status(404).json({ message: "Asset not found" });
  
  await asset.deleteOne();
  res.json({ message: "Deleted" });
});

export default router;
