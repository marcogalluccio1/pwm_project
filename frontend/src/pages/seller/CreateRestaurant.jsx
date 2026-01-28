import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { createMyRestaurantApi } from "../../api/restaurants.api";
import "../../styles/auth.css";
import logo from "/src/assets/logo.png";

export default function CreateRestaurant() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const initialErrors = useMemo(
    () => ({
      name: false,
      phone: false,
      address: false,
      city: false,
    }),
    []
  );

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
  });

  const [fieldErrors, setFieldErrors] = useState(initialErrors);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function clearFieldError(name) {
    setFieldErrors((prev) => ({ ...prev, [name]: false }));
  }

  function validate(payload) {
    const next = { ...initialErrors };

    if (!payload.name) next.name = true;
    if (!payload.phone) next.phone = true;
    if (!payload.address) next.address = true;
    if (!payload.city) next.city = true;

    // very light phone validation (optional)
    if (payload.phone && payload.phone.length < 6) next.phone = true;

    setFieldErrors(next);
    return Object.values(next).some(Boolean);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setFieldErrors(initialErrors);

    // quick guard: if not seller, go home (or to /login)
    const role = String(user?.role || "").toLowerCase();
    if (role !== "seller") {
      setError("Solo un ristoratore può creare un ristorante.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
    };

    if (validate(payload)) {
      setError("Compila correttamente tutti i campi.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createMyRestaurantApi(payload);

      // dopo creazione vai alla pagina gestione ristorante (se ce l'hai)
      // altrimenti vai su /me, che già mostra la sezione ristorante
      navigate("/me", { replace: true });
    } catch (err) {
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      if (status === 409) {
        setError("Hai già un ristorante associato.");
      } else if (status === 400) {
        setError(message || "Dati mancanti o non validi.");
      } else if (status === 401) {
        setError("Sessione scaduta. Effettua di nuovo il login.");
      } else if (status === 403) {
        setError("Non autorizzato: solo ristoratori.");
      } else {
        setError(message || "Errore durante la creazione del ristorante.");
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

        <h1 className="auth__title">Crea ristorante</h1>
        <p className="auth__subtitle">Inserisci i dati del tuo ristorante</p>

        {error && <div className="alert alert--error" style={{ marginTop: 12 }}>{error}</div>}

        <form noValidate onSubmit={handleSubmit} className="auth__form">
          <label className="auth__label">
            Nome ristorante
            <input
              className={`input ${fieldErrors.name ? "input--error" : ""}`}
              type="text"
              value={form.name}
              onChange={(e) => {
                setField("name", e.target.value);
                clearFieldError("name");
              }}
              autoComplete="organization"
            />
          </label>

          <label className="auth__label">
            Telefono
            <input
              className={`input ${fieldErrors.phone ? "input--error" : ""}`}
              type="tel"
              value={form.phone}
              onChange={(e) => {
                setField("phone", e.target.value);
                clearFieldError("phone");
              }}
              autoComplete="tel"
              placeholder="+39 02 123456"
            />
          </label>

          <label className="auth__label">
            Indirizzo
            <input
              className={`input ${fieldErrors.address ? "input--error" : ""}`}
              type="text"
              value={form.address}
              onChange={(e) => {
                setField("address", e.target.value);
                clearFieldError("address");
              }}
              autoComplete="street-address"
            />
          </label>

          <label className="auth__label">
            Città
            <input
              className={`input ${fieldErrors.city ? "input--error" : ""}`}
              type="text"
              value={form.city}
              onChange={(e) => {
                setField("city", e.target.value);
                clearFieldError("city");
              }}
              autoComplete="address-level2"
            />
          </label>

          <button className="btn btn--primary btn--lg" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creazione..." : "Crea ristorante"}
          </button>

          <Link to="/me" className="btn btn--ghost">
            Torna al profilo
          </Link>

          <Link to="/" className="btn btn--ghost">
            Torna alla Home
          </Link>

          <div className="auth__divider">
            <span>oppure</span>
          </div>
        </form>

        <p className="auth__footer">
          Hai già un ristorante? <Link to="/me">Gestiscilo dal profilo</Link>
        </p>
      </div>
    </div>
  );
}
