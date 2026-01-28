import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import CustomerMe from "./CustomerMe";
import SellerMe from "./SellerMe";
import TopBar from "../../components/TopBar";
import "./Me.css";

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