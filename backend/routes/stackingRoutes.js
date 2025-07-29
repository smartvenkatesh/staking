import express from "express";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import Web3 from "web3";
import Wallet from "../models/Wallet.js";
import mongoose from "mongoose";

const getBalance = async (address, network) => {
  let rpcUrl;
  if (network === "ETH") {
    rpcUrl = "https://sepolia.infura.io/v3/1a91b5d9c415499e9ef832508938e497";
  } else if (network === "AVAX") {
    rpcUrl =
      "https://nd-418-459-126.p2pify.com/8763cb5a211e1d4345acd51bde484c00/ext/bc/C/rpc";
  }
  console.log("rpcUrl", rpcUrl);

  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

  const balance = await web3.eth.getBalance(address);
  console.log("balance", balance);

  return web3.utils.fromWei(balance, "ether");
};

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body.formData;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const newAppUser = {
      username,
      email,
      password,
    };

    const saved = await User.create(newAppUser);

    res
      .status(200)
      .json({ message: "user successfully register", userId: saved._id });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: err.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body.form;
  try {
    const user = await User.findOne({ email: email });
    console.log("password", password);
    console.log("user.password", user.password);

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid Password" });
    }
    console.log("below");

    const jwtToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "5hr",
    });
    console.log("jwtToken", jwtToken);

    res.status(200).json({
      message: "Login successful",
      token: jwtToken,
      user_id: user._id,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/wallet", async (req, res) => {
  const { user_id, address, key, type } = req.body;

  try {
    const addAddress = await User.findById(user_id);
    const addWallets = new Wallet({
      customerId: user_id,
      address: address,
      privateKey: key,
      type: type,
    });
    await addWallets.save();
    res.status(200).json(addWallets);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Wallet creation failed" });
  }
});

router.get("/address/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId || userId === "null") {
    return res.status(400).json({ message: "Invalid userId" });
  }
  const newUserId = new mongoose.Types.ObjectId(userId);
  console.log("newUserId", newUserId);

  try {
    const user = await Wallet.find({ customerId: newUserId });
    console.log("user", user);

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/balance/:address/:network", async (req, res) => {
  const { address, network } = req.params;
  try {
    const bal = await getBalance(address, network);
    console.log("bal", bal);

    res.json({ balance: bal });
  } catch (err) {
    res.status(500).json({ message: "Error fetching balance" });
  }
});

router.get("/getAddress/:depositId", async (req, res) => {
  const { depositId } = req.params;
  const newUserId = new mongoose.Types.ObjectId(depositId);

  try {
    const getUser = await Wallet.find(
      { customerId: newUserId },
      { _id: 0, address: 1 }
    );
    console.log("getUser", getUser);

    res.status(200).json(getUser);
  } catch (error) {
    console.log(error);
  }
});

router.post("/addAmount/:account/:amount", async (req, res) => {
  const { account, amount } = req.params;
  try {
    let wallet = await Wallet.findOne({ address: account });

    wallet.amount = (parseFloat(wallet.amount) || 0) + parseFloat(amount);
    await wallet.save();

    res.status(200).json({ message: "Amount added successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
