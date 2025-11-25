import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  // monthly budget in user's base currency
  budget: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
