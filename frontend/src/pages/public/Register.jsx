import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import "../../styles/auth.css";
import logo from "/src/assets/logo.png";
import { LuUser, LuStore } from "react-icons/lu";

export default function Register() {
  const navigate = useNavigate();
  const { register: registerApi } = useAuth();

  const [stepRole, setStepRole] = useState(true);
  const [role, setRole] = useState("");
  const [direction, setDirection] = useState("forward");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [vatNumber, setVatNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const initialErrors = useMemo(
    () => ({
      role: false,
      firstName: false,
      lastName: false,
      vatNumber: false,
      email: false,
      password: false,
    }),
    []
  );

  const [fieldErrors, setFieldErrors] = useState(initialErrors);

  function resetErrors() {
    setError("");
    setFieldErrors(initialErrors);
  }

  function goBackToRole() {
    resetErrors();
    setDirection("back");
    setStepRole(true);
    setRole("");
  }

  function chooseRole(nextRole) {
    resetErrors();
    setDirection("forward");
    setRole(nextRole);
    setStepRole(false);
  }


  async function handleSubmit(e) {
    e.preventDefault();
    resetErrors();

    const normalizedEmail = email.trim().toLowerCase();
    const nextErrors = { ...initialErrors };

    if (!role) nextErrors.role = true;
    if (!firstName.trim()) nextErrors.firstName = true;
    if (!lastName.trim()) nextErrors.lastName = true;
    if (!normalizedEmail) nextErrors.email = true;
    if (!password) nextErrors.password = true;

    if (role === "seller" && !vatNumber.trim()) nextErrors.vatNumber = true;

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    if (normalizedEmail && !emailOk) nextErrors.email = true;

    if (password && password.length < 8) nextErrors.password = true;

    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (hasErrors) {
      setFieldErrors(nextErrors);

      if (stepRole) {
        setError("Seleziona il tipo di account per continuare.");
      } else if (nextErrors.password && password && password.length < 8) {
        setError("La password deve essere lunga almeno 8 caratteri.");
      } else if (nextErrors.email && normalizedEmail && !emailOk) {
        setError("Inserisci un'email valida.");
      } else {
        setError("Compila correttamente tutti i campi.");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        role,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        password,
        ...(role === "seller" ? { vatNumber: vatNumber.trim() } : {}),
      };

      await registerApi(payload);
      navigate("/", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 409) {
        setFieldErrors((prev) => ({ ...prev, email: true }));
        setError("Email già registrata.");
      } else if (status === 400) {
        setError(message || "Dati mancanti o non validi.");
      } else {
        setError(message || "Errore durante la registrazione.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth page">
      <div className="card auth__card">
        <div className="auth__brand">
          <img src={logo} alt="FastFood logo" className="auth__logo" />
          <div className="auth__brandText">
            Fast<span>Food</span>
          </div>
        </div>

        <h1 className="auth__title">Registrazione</h1>
        <p className="auth__subtitle">
          {stepRole
            ? "Scegli il tipo di account per continuare"
            : `Stai creando un account ${role === "seller" ? "Ristoratore" : "Cliente"}`}
        </p>

        {error && (
          <div className="alert alert--error" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        <div
          className={`auth__step ${
            direction === "back" ? "auth__step--back" : "auth__step--forward"
          }`}
          key={stepRole ? "role-step" : `form-step-${role || "none"}`}
        >
          {stepRole ? (
            <>
              <div className="auth__form" style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className="btn btn--secondary btn--lg"
                  onClick={() => chooseRole("customer")}
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    padding: "16px 18px",
                    borderRadius: 16,
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      flex: "0 0 auto",
                    }}
                  >
                    <LuUser className="auth__roleIcon" />
                  </span>

                  <span style={{ display: "grid", gap: 2, textAlign: "left" }}>
                    <span style={{ fontWeight: 900 }}>Cliente</span>
                    <span style={{ color: "rgba(255,255,255,0.78)", fontWeight: 700, fontSize: 13 }}>
                      Ordina dai ristoranti e gestisci i tuoi acquisti
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  className="btn btn--secondary btn--lg"
                  onClick={() => chooseRole("seller")}
                  style={{
                    width: "100%",
                    justifyContent: "flex-start",
                    padding: "16px 18px",
                    borderRadius: 16,
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      flex: "0 0 auto",
                    }}
                  >
                    <LuStore className="auth__roleIcon" />
                  </span>

                  <span style={{ display: "grid", gap: 2, textAlign: "left" }}>
                    <span style={{ fontWeight: 900 }}>Ristoratore</span>
                    <span style={{ color: "rgba(255,255,255,0.78)", fontWeight: 700, fontSize: 13 }}>
                      Crea il tuo ristorante e gestisci il menù
                    </span>
                  </span>
                </button>

                <Link to="/" className="btn btn--ghost">
                  Torna alla Home
                </Link>

                <div className="auth__divider">
                  <span>oppure</span>
                </div>
              </div>

              <p className="auth__footer">
                Hai già un account? <Link to="/login">Accedi</Link>
              </p>
            </>
          ) : (
            <>
              <form noValidate onSubmit={handleSubmit} className="auth__form">
                <button type="button" className="btn btn--ghost" onClick={goBackToRole}>
                  ← Cambia tipo account
                </button>

                <label className="auth__label">
                  Nome
                  <input
                    className={`input ${fieldErrors.firstName ? "input--error" : ""}`}
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, firstName: false }));
                    }}
                    autoComplete="given-name"
                  />
                </label>

                <label className="auth__label">
                  Cognome
                  <input
                    className={`input ${fieldErrors.lastName ? "input--error" : ""}`}
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, lastName: false }));
                    }}
                    autoComplete="family-name"
                  />
                </label>

                {role === "seller" && (
                  <label className="auth__label">
                    Partita IVA
                    <input
                      className={`input ${fieldErrors.vatNumber ? "input--error" : ""}`}
                      type="text"
                      value={vatNumber}
                      onChange={(e) => {
                        setVatNumber(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, vatNumber: false }));
                      }}
                      autoComplete="off"
                    />
                  </label>
                )}

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
                    autoComplete="new-password"
                  />
                </label>

                <button className="btn btn--primary btn--lg" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creazione..." : "Crea account"}
                </button>

                <Link to="/" className="btn btn--ghost">
                  Torna alla Home
                </Link>

                <div className="auth__divider">
                  <span>oppure</span>
                </div>
              </form>

              <p className="auth__footer">
                Hai già un account? <Link to="/login">Accedi</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
