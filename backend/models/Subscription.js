import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  cost: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  category: { type: String },
  renewalDate: { type: String }, // Storing as string for simplicity
}, { timestamps: true });

export default mongoose.model("Subscription", subscriptionSchema);
