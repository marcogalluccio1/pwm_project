import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import CustomerMe from "./CustomerMe";
import SellerMe from "./SellerMe";
import "./Me.css";

export default function Me() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="page">
        <div className="container">
          <div className="card me__card">
            <p style={{ margin: 0, opacity: 0.85 }}>Caricamento profilo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  const role = (user.role).toLowerCase();
  const isSeller = role === "seller";

  return (
    <div className="auth">
      <div className="container">{isSeller ? <SellerMe /> : <CustomerMe />}</div>
    </div>
  );
}
