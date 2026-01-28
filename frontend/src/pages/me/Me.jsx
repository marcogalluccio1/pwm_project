import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import CustomerMe from "./CustomerManagement";
import SellerMe from "./SellerManagement";
import TopBar from "../../components/TopBar";
import "../../styles/management.css";

export default function Me() {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  const role = user.role.toLowerCase();
  const isSeller = role === "seller";

  return (
    <div className="meLayout page">
      <TopBar variant="brandOnly" />

      <main className="meLayout__main">
        <div className="container">{isSeller ? <SellerMe /> : <CustomerMe />}</div>
      </main>
    </div>
  );
}