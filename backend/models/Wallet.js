import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  address: String,
  privateKey: String,
  amount: Number,
  type: String,
});

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;
