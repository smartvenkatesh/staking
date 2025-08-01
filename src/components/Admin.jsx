import React, { useEffect, useState } from "react";
import "../App.css";
import axios from "axios";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast, ToastContainer } from "react-toastify";

const Admin = () => {
  const [wallets, setWallets] = useState([]);
  const [stakeDetails, setStakeDetails] = useState([]);
  const [activeTab, setActiveTab] = useState("home");
  const getWallets = () => {
    axios
      .get("http://localhost:8080/staking/all-wallets")
      .then((res) => {
        setWallets(res.data);
        console.log(res.data);
      })
      .catch((err) => {
        console.error("Error fetching wallets", err);
      });
  };

  useEffect(() => {
    getWallets();
  }, []);

  const deleteAddress = (id) => {
    axios
      .delete(`http://localhost:8080/staking/admin/delete/${id}`)
      .then((res) => {
        if (res.status === 200) {
          toast.success(res.data.message);
        } else if (res.status === 201) {
          toast.warning(res.data.message);
        }
        getWallets();
      });
  };

  const getStakeDetails = () => {
    setActiveTab("stake");
    axios.get("http://localhost:8080/staking/stakes").then((res) => {
      setStakeDetails(res.data);
      console.log("res.data", res.data);
    });
  };

  const adminHome = () => {
    setActiveTab("home");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    window.location.href = "/login";
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1 onClick={adminHome}>
          Staking <span>Admin Panel</span>
        </h1>
        {activeTab === "home" && (
          <button className="btn btn-success" onClick={getStakeDetails}>
            Staking Details
          </button>
        )}
        {activeTab === "stake" && (
          <button className="btn btn-primary" onClick={adminHome}>
            Back To Home
          </button>
        )}
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      {activeTab === "home" && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>No</th>
                <th>User Name</th>
                <th>Network</th>
                <th>Logo</th>
                <th>Wallet Address</th>
                <th>Balance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((wallet, index) => (
                <tr key={wallet._id}>
                  <td>{index + 1}</td>
                  <td>{wallet.admin.username || "N/A"}</td>
                  <td>{wallet.type}</td>
                  <td>
                    <img
                      src={
                        wallet.type === "ETH"
                          ? "https://assets.coingecko.com/coins/images/279/large/ethereum.png"
                          : "https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png"
                      }
                      alt={wallet.type}
                      width="30"
                      height="30"
                      style={{ objectFit: "contain" }}
                    />
                  </td>
                  <td>{wallet.address}</td>
                  <td>{wallet.amount}</td>
                  <td>
                    <DeleteIcon
                      color="error"
                      onClick={() => deleteAddress(wallet._id)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "stake" && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>No</th>
                <th>User Name</th>
                <th>Network</th>
                <th>Logo</th>
                <th>Wallet Address</th>
                <th>Stake Amount</th>
                <th>Time & Date</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {stakeDetails.map((stake, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{stake.user_details.username}</td>
                  <td>{stake.network}</td>
                  <td>
                    {" "}
                    <img
                      src={
                        stake.network === "ETH"
                          ? "https://assets.coingecko.com/coins/images/279/large/ethereum.png"
                          : "https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png"
                      }
                      alt={stake.network}
                      width="30"
                      height="30"
                      style={{ objectFit: "contain" }}
                    />
                  </td>
                  <td>{stake.wallet_details.address}</td>
                  <td>{stake.amount}</td>
                  <td>{stake.stakeDate}</td>
                  <td>{stake.wallet_details.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <ToastContainer />
    </div>
  );
};

export default Admin;
