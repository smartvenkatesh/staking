import mongoose from "mongoose";

const stakeSchema = new mongoose.Schema(
  {
    address: String,
    password: String,
    amount: Number,
  },
  {
    timestamps: true,
  }
);

const Stake = mongoose.model("Stake", stakeSchema);

export default Stake;
