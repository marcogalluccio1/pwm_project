import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import logo from "../assets/logo.png";


function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M4 20.2a8 8 0 0 1 16 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function TopBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="topbar__inner">
        {/* sx */}
        <Link to="/" className="topbar__logo">
          <img
            src={logo}
            alt="FastFood logo"
            className="topbar__logo-img"
          />

          <div className="topbar__title">
            Fast<span>Food</span>
          </div>
        </Link>

        {/* centro */}
        <div className="topbar__center" />

        {/* dx */}
        <div className="topbar__actions">
          {user ? (
            <div className="userMenu">
              <span className="userMenu__trigger">
                <UserIcon />
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
