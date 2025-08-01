import express from "express";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";
import Web3 from "web3";
import Wallet from "../models/Wallet.js";
import mongoose from "mongoose";
import Staking from "../models/Staking.js";
import cron from "node-cron";

const fetchCryptoRates = async () => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,avalanche-2&vs_currencies=usd"
    );

    const data = await response.json();

    const ethRate = data.ethereum.usd;
    console.log("ethRate", ethRate);

    const avaxRate = data["avalanche-2"].usd;

    return { ethRate, avaxRate };
  } catch (error) {
    console.error("Error fetching crypto rates:", error);
    return { ethRate: 0, avaxRate: 0 };
  }
};

const getBalance = async (address, network) => {
  let rpcUrl;
  let cryptoRate;

  const { ethRate, avaxRate } = await fetchCryptoRates();

  if (network === "ETH") {
    rpcUrl = "https://sepolia.infura.io/v3/1a91b5d9c415499e9ef832508938e497";
    cryptoRate = ethRate;
    console.log("cryptoRate", cryptoRate);
  } else if (network === "AVAX") {
    rpcUrl = "https://api.avax.network/ext/bc/C/rpc";
    cryptoRate = avaxRate;
  }

  const web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));

  const balance = await web3.eth.getBalance(address);
  console.log("balance", balance);

  const balanceInEth = web3.utils.fromWei(balance, "ether");
  console.log("balanceInEth", balanceInEth);

  const virtualMoneyInUsd = 100;

  const virtualMoneyInCrypto = virtualMoneyInUsd / cryptoRate;

  console.log(
    "Virtual money in crypto (ETH/AVAX equivalent):",
    virtualMoneyInCrypto
  );

  return { balanceInEth, virtualMoneyInCrypto };
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

    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    const jwtToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "5hr",
    });
    console.log("jwtToken", jwtToken);

    res.status(200).json({
      message: "Login successful",
      token: jwtToken,
      user_id: user._id,
      role: user.role,
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
      amount: 0,
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

  try {
    const user = await Wallet.find({ customerId: newUserId });

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
    const wallet = await Wallet.findOne({ address });
    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const virtualUsd = parseFloat(wallet.amount || 0);

    const { ethRate, avaxRate } = await fetchCryptoRates();

    let virtualInCrypto;
    if (network === "ETH") {
      virtualInCrypto = virtualUsd / ethRate;
      console.log("virtualInCrypto", virtualInCrypto);
    } else if (network === "AVAX") {
      virtualInCrypto = virtualUsd / avaxRate;
    }

    const realBal = await getBalance(address, network);

    res.json({
      address,
      network,
      realBalanceInCrypto: realBal.balanceInEth,
      virtualUsd,
      virtualInCrypto: virtualInCrypto.toFixed(6),
    });
  } catch (err) {
    console.error(err);
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

router.get("/all-wallets", async (req, res) => {
  try {
    const wallets = await Wallet.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "customerId",
          foreignField: "_id",
          as: "admin",
        },
      },
      { $unwind: "$admin" },
      {
        $project: {
          _id: 1,
          address: 1,
          type: 1,
          amount: 1,
          "admin.username": 1,
        },
      },
    ]);
    res.status(200).json(wallets);
  } catch (err) {
    res.status(500).json({ message: "Error fetching wallets" });
  }
});

router.delete("/admin/delete/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const stake = await Staking.findOne({ walletId: id });
    console.log(stake);
    if (stake === null) {
      const deleteWallet = await Wallet.findByIdAndDelete({ _id: id });
    } else if (stake !== 0)
      res.status(201).json({ message: "This wallet process in staking " });
    else res.status(200).json({ message: "Wallet Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/stake", async (req, res) => {
  const { userId, walletId, amount, duration, network } = req.body;

  try {
    const wallet = await Wallet.findById(walletId);
    if (!wallet || wallet.amount < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }
    wallet.amount -= amount;
    await wallet.save();

    const newStake = new Staking({
      customerId: userId,
      walletId,
      amount,
      duration,
      network,
    });

    await newStake.save();

    res.status(200).json({ message: "Staking successful", stake: newStake });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Staking failed" });
  }
});

router.get("/stakes", async (req, res) => {
  try {
    const stakes = await Staking.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "customerId",
          foreignField: "_id",
          as: "user_details",
        },
      },
      { $unwind: "$user_details" },
      {
        $lookup: {
          from: "wallets",
          localField: "walletId",
          foreignField: "_id",
          as: "wallet_details",
        },
      },
      { $unwind: "$wallet_details" },
      {
        $project: {
          _id: 1,
          amount: 1,
          network: 1,
          duration: 1,
          status: 1,
          stakeDate: 1,
          "user_details.username": 1,
          "wallet_details.address": 1,
          "wallet_details.amount": 1,
        },
      },
    ]);

    res.status(200).json(stakes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stakes" });
  }
});

cron.schedule("*/5 * * * *", async (req, res) => {
  console.log("active cron...");
});

export default router;
