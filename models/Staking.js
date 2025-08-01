import mongoose from "mongoose";

const stakingSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
    required: true,
  },
  amount: { type: Number, required: true },
  network: { type: String, enum: ["ETH", "AVAX"], required: true },
  stakeDate: { type: Date, default: Date.now },
  duration: { type: Number, required: true }, // in days
  status: { type: String, default: "active" }, // active, completed
});

export default mongoose.model("Staking", stakingSchema);
