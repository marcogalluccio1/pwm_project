import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";


export default function TopBar() {
  const { user } = useAuth();
    console.log("USER IN TOPBAR:", user);
  return (
    <header className="topbar">
      <div className="topbar__inner">
        {/* sx */}
        <Link to="/" className="topbar__logo">
          <div className="topbar__mark" />
          <div className="topbar__title">
            Fast<span>Food</span>
          </div>
        </Link>

        {/* centro */}
        <nav className="topbar__center">
          {/* in futuro: Ristoranti | Ordini | Offerte */}
        </nav>

        {/* dx */}
        <div className="topbar__actions">
          {user ? (
            <Link to="/me" className="btn btn--primary">
              Area personale
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn--ghost">
                Accedi
              </Link>
              <Link to="/register" className="btn btn--primary">
                Registrati
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
