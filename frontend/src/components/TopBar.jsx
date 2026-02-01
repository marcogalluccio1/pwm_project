import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import logo from "../assets/logo.png";
import { LuUser } from "react-icons/lu";

export default function TopBar({ variant = "default" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  
  const role = String(user?.role || "").toLowerCase();
  const isCustomer = role === "customer";

  const isBrandOnly = variant === "brandOnly";

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <Link to="/" className="topbar__logo">
          <img src={logo} alt="FastFood logo" className="topbar__logo-img" />
          <div className="topbar__title">
            Fast<span>Food</span>
          </div>
        </Link>

        <div className="topbar__center">
          {isBrandOnly ? null : (
            <nav className="topbar__nav" aria-label="Sezioni principali">
              <Link to="/restaurants" className="topbar__navLink">
                Ristoranti
              </Link>

              <span className="topbar__navDivider" />

              <Link to="/meals" className="topbar__navLink">
                I nostri piatti
              </Link>

              <span className="topbar__navDivider" />

              <Link to="/promotions" className="topbar__navLink">
                Novità e promozioni
              </Link>
            </nav>

          )}
        </div>

        <div className="topbar__actions">
          {isBrandOnly ? null : user ? (
            <div className="userMenu">
              <span className="userMenu__trigger">
                <LuUser />
                Area personale
              </span>

              <div className="userMenu__panel card">
                <div className="userMenu__meta">
                  <div className="userMenu__name">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="userMenu__email">{user.email}</div>
                </div>

                <div className="userMenu__divider" />

                <Link to="/me" className="userMenu__item">
                  Modifica dati account
                </Link>

                {isCustomer ? (
                  <Link to="/customer/orders" className="userMenu__item">
                    I tuoi ordini
                  </Link>
                  ) : ""
                }

                <button
                  type="button"
                  className="userMenu__item userMenu__item--danger"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
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
