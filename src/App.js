import React from "react";
import Staking from "./components/Staking";
import { Route, Routes } from "react-router-dom";
import Register from "./components/Register";
import Login from "./components/Login";
import Home from "./components/Home";
import Deposit from "./components/Deposit";
import Admin from "./components/Admin";

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/staking/home" element={<Home />} />
      <Route path="/staking/deposit" element={<Deposit />} />
      <Route path="/staking/balance" element={<Staking />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
};

export default App;
