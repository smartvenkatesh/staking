import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import Table from "react-bootstrap/Table";
import Web3 from "web3";
import "../App.css";
import NavDropdown from "react-bootstrap/NavDropdown";
import Backdrop from "@mui/material/Backdrop";
import CircularProgress from "@mui/material/CircularProgress";
import { toast, ToastContainer } from "react-toastify";

const PORT = "http://localhost:8080/staking";

const Home = () => {
  const [userId, setUserId] = useState("");
  const [newAccount, setNewAccount] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState("ETH");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [toCurrency, setToCurrency] = useState("USD");
  const [convertedAmount, setConvertedAmount] = useState(1);
  const [amount, setAmount] = useState(1);
  const [open, setOpen] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [stakeInputs, setStakeInputs] = useState({});

  const navigate = useNavigate();

  const getWallets = async (toCurrency) => {
    const type = toCurrency.toLowerCase();
    console.log("type", type);
    setOpen(true);
    try {
      const res = await axios.get(`${PORT}/address/${userId}`);
      const wallets = res.data;

      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=ethereum,avalanche-2&vs_currencies=${type}`
      );
      const ethRate = response.data.ethereum[type];
      const avaxRate = response.data["avalanche-2"][type];

      const updatedWallets = wallets.map((wallet) => {
        let rate = 1;
        if (wallet.type === "ETH") rate = ethRate;
        else if (wallet.type === "AVAX") rate = avaxRate;

        const virtualMoneyInCrypto = wallet.amount / rate;
        return { ...wallet, virtualMoneyInCrypto };
      });

      setTransactions(updatedWallets);
      setOpen(false);
    } catch (err) {
      console.error("Wallet fetch error", err);
    }
  };

  useEffect(() => {
    const stateUserId = localStorage.getItem("userId");
    if (stateUserId) {
      setUserId(stateUserId);
    }
    console.log(stateUserId);
  }, []);

  useEffect(() => {
    if (userId) {
      getWallets(toCurrency);

      const fetchExchangeRate = async () => {
        try {
          const response = await fetch(
            "https://api.exchangerate-api.com/v4/latest/USD"
          );
          const data = await response.json();
          setExchangeRate(data.rates[toCurrency]);
        } catch (error) {
          console.error("Error fetching exchange rate:", error);
        }
      };

      fetchExchangeRate();
    }
  }, [userId, toCurrency]);

  useEffect(() => {
    setConvertedAmount((amount * exchangeRate).toFixed(2));
    console.log(convertedAmount);
  }, [amount, exchangeRate]);

  const createAccounts = async () => {
    const web3 = new Web3();
    const account = web3.eth.accounts.create();

    setNewAccount(account.address);
    setPrivateKey(account.privateKey);

    await axios.post("http://localhost:8080/staking/wallet", {
      user_id: userId,
      address: account.address,
      key: account.privateKey,
      type: selectedNetwork,
    });

    getWallets(toCurrency);
  };

  const goToDeposit = () => {
    navigate("/staking/deposit", { state: userId });
  };

  const handleStake = async (walletId, network) => {
    const walletInput = stakeInputs[walletId];

    if (!walletInput?.amount || !walletInput?.duration) {
      return alert("Please enter amount and duration");
    }

    try {
      await axios.post(`${PORT}/stake`, {
        userId,
        walletId,
        amount: walletInput.amount,
        duration: walletInput.duration,
        network,
      });

      toast.success("Staking successful!");

      setStakeInputs((prev) => ({
        ...prev,
        [walletId]: { amount: "", duration: "" },
      }));

      getWallets(toCurrency);
    } catch (err) {
      console.error(err);
      toast.error(err.response.data.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login");
  };

  return (
    <div>
      <Backdrop
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
        open={open}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand>User Wallets</Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse>
            <Nav className="me-auto">
              <Nav.Link onClick={createAccounts}>Create Account</Nav.Link>
              <NavDropdown title="Select Network" id="basic-nav-dropdown">
                <NavDropdown.Item onClick={() => setSelectedNetwork("ETH")}>
                  Ethereum
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => setSelectedNetwork("AVAX")}>
                  Avalanche
                </NavDropdown.Item>
              </NavDropdown>
              <Nav.Link onClick={goToDeposit}>Deposit</Nav.Link>
              <NavDropdown
                title={`Currency: ${toCurrency}`}
                id="currency-nav-dropdown"
              >
                <NavDropdown.Item onClick={() => setToCurrency("USD")}>
                  USD
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => setToCurrency("INR")}>
                  INR
                </NavDropdown.Item>
                <NavDropdown.Item onClick={() => setToCurrency("EUR")}>
                  EUR
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
          <Nav>
            <Nav.Link
              onClick={handleLogout}
              id="logout"
              className="bg-warning text-dark"
            >
              Logout
            </Nav.Link>
          </Nav>
        </Container>
      </Navbar>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>No</th>
            <th>Network</th>
            <th className="text-center">Logo</th>
            <th>Address</th>
            <th>Balance</th>
            <th>Balance in (ETH/AVAX)</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((wallet, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{wallet.type}</td>
              <td className="text-center">
                <img
                  src={
                    wallet.type === "ETH"
                      ? "https://assets.coingecko.com/coins/images/279/large/ethereum.png"
                      : "https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png"
                  }
                  alt={wallet.type}
                  width="30"
                  height="30"
                />
              </td>
              <td>{wallet.address}</td>
              <td>
                {(wallet.amount * exchangeRate).toFixed(2)} {toCurrency}
                <div style={{ marginTop: 10 }}>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={stakeInputs[wallet._id]?.amount || ""}
                    onChange={(e) =>
                      setStakeInputs((prev) => ({
                        ...prev,
                        [wallet._id]: {
                          ...prev[wallet._id],
                          amount: e.target.value,
                        },
                      }))
                    }
                    style={{ width: "70px", marginRight: "5px" }}
                  />
                  <input
                    type="number"
                    placeholder="Days"
                    value={stakeInputs[wallet._id]?.duration || ""}
                    onChange={(e) =>
                      setStakeInputs((prev) => ({
                        ...prev,
                        [wallet._id]: {
                          ...prev[wallet._id],
                          duration: e.target.value,
                        },
                      }))
                    }
                    style={{ width: "60px", marginRight: "5px" }}
                  />

                  <button
                    onClick={() => {
                      setSelectedWalletId(wallet._id);
                      handleStake(wallet._id, wallet.type);
                    }}
                    style={{
                      background: "green",
                      color: "white",
                      border: "none",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Stake
                  </button>
                </div>
              </td>

              <td>
                {wallet.virtualMoneyInCrypto
                  ? wallet.virtualMoneyInCrypto.toFixed(8) + " " + wallet.type
                  : "0" + " " + wallet.type}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <ToastContainer />
    </div>
  );
};

export default Home;
