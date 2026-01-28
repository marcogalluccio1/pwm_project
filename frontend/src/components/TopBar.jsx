import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import logo from "../assets/logo.png";
import { LuUser } from "react-icons/lu";

export default function TopBar({ variant = "default" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isBrandOnly = variant === "brandOnly";

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar__inner">
        {/* sx */}
        <Link to="/" className="topbar__logo">
          <img src={logo} alt="FastFood logo" className="topbar__logo-img" />
          <div className="topbar__title">
            Fast<span>Food</span>
          </div>
        </Link>

        {/* centro */}
        <div className="topbar__center" />

        {/* dx */}
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
