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

const PORT = "http://localhost:8080/staking";

const Home = () => {
  const [userId, setUserId] = useState("");
  const [newAccount, setNewAccount] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState("ETH");
  const [exchangeRate, setExchangeRate] = useState(1);
  const [toCurrency, setToCurrency] = useState("INR");
  const [convertedAmount, setConvertedAmount] = useState(1);
  const [amount, setAmount] = useState(15);

  const navigate = useNavigate();

  const getWallets = async () => {
    const res = await axios.get(
      `http://localhost:8080/staking/address/${userId}`
    );
    console.log("res.data", res.data);

    setTransactions(res.data);
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
      getWallets();

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

    getWallets();
  };

  const goToDeposit = () => {
    navigate("/staking/deposit", { state: userId });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div>
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
            <th>Address</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((wallet, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>{wallet.type}</td>
              <td>{wallet.address}</td>
              <td>
                {(wallet.amount * exchangeRate).toFixed(2)} {toCurrency}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default Home;
