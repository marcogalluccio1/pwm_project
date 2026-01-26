import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Inserisci email e password.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 401) setError("Credenziali non valide.");
      else if (status === 400) setError(message || "Dati mancanti o non validi.");
      else setError(message || "Errore durante il login.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth page">
      <div className="card auth__card">
        <div className="brand">FastFood</div>
        <h1 className="auth__title">Login</h1>
        <p className="auth__subtitle">Accedi per ordinare e gestire i tuoi ordini.</p>

        {error && <div className="alert alert--error" style={{ marginTop: 12 }}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth__form">
          <label className="auth__label">
            Email
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="auth__label">
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <button className="btn btn--primary btn--lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Accesso..." : "Accedi"}
          </button>

          <Link to="/" className="btn btn--ghost">
            Torna alla Home
          </Link>
        </form>

        <p className="auth__footer">
          Non hai un account? <Link to="/register">Registrati</Link>
        </p>
      </div>
    </div>
  );
}
