import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import "../../styles/auth.css";
import logo from "/src/assets/logo.png";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [fieldErrors, setFieldErrors] = useState({
    email: false,
    password: false,
  });

  const location = useLocation();
  const redirectTo = location.state?.from || "/";


  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors({ email: false, password: false });

    const normalizedEmail = email.trim();
    const nextErrors = { email: false, password: false };

    if (!normalizedEmail) nextErrors.email = true;
    if (!password) nextErrors.password = true;

    if (nextErrors.email || nextErrors.password) {
      setFieldErrors(nextErrors);
      setError("Compila correttamente tutti i campi.");
      return;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (!emailOk) {
      setFieldErrors({ email: true, password: false });
      setError("Inserisci un'email valida.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(normalizedEmail, password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 401) {
        setFieldErrors({ email: true, password: true });
        setError("Credenziali non valide.");
      } else if (status === 400) {
        setError(message || "Dati mancanti o non validi.");
      } else {
        setError(message || "Errore durante il login.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }


  return (
    <div className="auth page">
      <div className="card auth__card">
        <div className="auth__brand">
          <img
            src={logo}
            alt="FastFood logo"
            className="auth__logo"
          />
          <div className="auth__brandText">
            Fast<span>Food</span>
          </div>
        </div>

        <h1 className="auth__title">Login</h1>
        <p className="auth__subtitle">Accedi inserendo le tue credenziali</p>

        {error && <div className="alert alert--error" style={{ marginTop: 12 }}>{error}</div>}

        <form noValidate onSubmit={handleSubmit} className="auth__form">
          <label className="auth__label">
            Email
            <input
              className={`input ${fieldErrors.email ? "input--error" : ""}`}
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: false }));
              }}
              autoComplete="email"
            />
          </label>

          <label className="auth__label">
            Password
            <input
              className={`input ${fieldErrors.password ? "input--error" : ""}`}
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: false }));
              }}
              autoComplete="current-password"
            />
          </label>

          <button className="btn btn--primary btn--lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Accesso..." : "Accedi"}
          </button>

          <Link to="/" className="btn btn--ghost">
            Torna alla Home
          </Link>
          <div className="auth__divider">
            <span>oppure</span>
          </div>
        </form>
        
        <p className="auth__footer">
          Non hai un account? <Link to="/register">Registrati</Link>
        </p>
      </div>
    </div>
  );
}
