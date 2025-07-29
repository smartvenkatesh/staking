import React from "react";
import "../App.css";

const Admin = () => {
  const handleLogout = () => {};
  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>
          Staking <span>Admin Panel</span>
        </h1>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>
    </div>
  );
};

export default Admin;
