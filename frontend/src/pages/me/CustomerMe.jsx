import React, { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { updateMeApi, deleteMeApi } from "../../api/auth.api";

export default function CustomerMe() {
  const { user, refreshMe, logout } = useAuth();
  const navigate = useNavigate();

  const initial = useMemo(
    () => ({
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",

      // password change fields
      oldPassword: "",
      newPassword: "",

      payment: {
        method: user?.payment?.method || "card",
        cardBrand: user?.payment?.cardBrand || "",
        cardLast4: user?.payment?.cardLast4 || "",
        holderName: user?.payment?.holderName || "",
      },

      preferences: {
        favoriteMealTypes: (user?.preferences?.favoriteMealTypes || []).join(", "),
        marketingOptIn: Boolean(user?.preferences?.marketingOptIn),
      },
    }),
    [user]
  );

  const [form, setForm] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [dangerOpen, setDangerOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // input errors (global class: input--error)
  const [fieldErrors, setFieldErrors] = useState({});

  // success message timer
  const msgTimerRef = useRef(null);

  useEffect(() => {
    setForm(initial);
    setFieldErrors({});
    // IMPORTANT: do NOT clear msg/err here (refreshMe would wipe it instantly)
  }, [initial]);

  useEffect(() => {
    if (!msg) return;

    if (msgTimerRef.current) clearTimeout(msgTimerRef.current);

    msgTimerRef.current = setTimeout(() => {
      setMsg("");
      msgTimerRef.current = null;
    }, 4000);

    return () => {
      if (msgTimerRef.current) clearTimeout(msgTimerRef.current);
    };
  }, [msg]);

  function clearFieldError(key) {
    setFieldErrors((prev) => {
      if (!prev?.[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  function setPaymentField(name, value) {
    setForm((f) => ({ ...f, payment: { ...f.payment, [name]: value } }));
  }

  function setPrefField(name, value) {
    setForm((f) => ({ ...f, preferences: { ...f.preferences, [name]: value } }));
  }

  function buildPayload() {
    const payload = {
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
    };

    const oldPassword = form.oldPassword.trim();
    const newPassword = form.newPassword.trim();

    // password change is optional, but if provided we send both fields
    if (oldPassword || newPassword) {
      payload.oldPassword = oldPassword;
      payload.password = newPassword;
    }

    const favoriteMealTypes = form.preferences.favoriteMealTypes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    payload.preferences = {
      favoriteMealTypes,
      marketingOptIn: Boolean(form.preferences.marketingOptIn),
    };

    const method = form.payment.method;
    payload.payment = { method };

    if (method === "card" || method === "prepaid") {
      payload.payment.cardBrand = form.payment.cardBrand.trim();
      payload.payment.cardLast4 = form.payment.cardLast4.trim();
      payload.payment.holderName = form.payment.holderName.trim();
    }

    return payload;
  }

  // marks ONLY required/conditional fields
  function validateAndMark(payload) {
    const errors = {};

    // required
    if (!payload.email) errors.email = true;
    if (!payload.firstName) errors.firstName = true;
    if (!payload.lastName) errors.lastName = true;

    // optional password change: if one is set, both are required
    const hasOld = Boolean(payload.oldPassword);
    const hasNew = Boolean(payload.password);

    if (hasOld || hasNew) {
      if (!hasOld) errors.oldPassword = true;
      if (!hasNew) errors.newPassword = true;
      if (hasNew && payload.password.length < 8) errors.newPassword = true;
    }

    // payment required only for card/prepaid
    const method = payload.payment?.method;

    if (method === "card" || method === "prepaid") {
      const { cardBrand, cardLast4, holderName } = payload.payment || {};
      if (!cardBrand) errors["payment.cardBrand"] = true;
      if (!holderName) errors["payment.holderName"] = true;
      if (!cardLast4) errors["payment.cardLast4"] = true;
      if (cardLast4 && !/^\d{4}$/.test(cardLast4)) errors["payment.cardLast4"] = true;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length > 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const payload = buildPayload();
    const hasErrors = validateAndMark(payload);

    if (hasErrors) {
      setErr("Controlla i campi evidenziati in rosso.");
      return;
    }

    setIsSaving(true);
    try {
      await updateMeApi(payload);
      setMsg("Profilo aggiornato.");

      setField("oldPassword", "");
      setField("newPassword", "");
      clearFieldError("oldPassword");
      clearFieldError("newPassword");

      await refreshMe();
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;

      if (status === 409) {
        setFieldErrors((p) => ({ ...p, email: true }));
        setErr(message || "Email già registrata.");
      } else if (status === 400) {
        setErr(message || "Dati non validi.");
      } else if (status === 401) {
        setFieldErrors((p) => ({ ...p, oldPassword: true }));
        setErr("Vecchia password errata.");
      } else {
        setErr(message || "Errore durante il salvataggio.");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setMsg("");
    setErr("");
    setDeleteBusy(true);

    try {
      await deleteMeApi();
      logout();
      navigate("/", { replace: true });
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;

      if (status === 409) setErr(message || "Non puoi eliminare l'account con ordini attivi.");
      else if (status === 401) setErr("Sessione scaduta. Effettua di nuovo il login.");
      else setErr(message || "Errore durante l'eliminazione account.");
    } finally {
      setDeleteBusy(false);
      setDangerOpen(false);
    }
  }

  const isCardLike = form.payment.method === "card" || form.payment.method === "prepaid";

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="card me__card">
      <h1 className="me__title">Profilo cliente</h1>
      <p className="me__subtitle">Modifica i tuoi dati qui sotto</p>

      {err && (
        <div className="alert alert--error" style={{ marginTop: 12 }}>
          {err}
        </div>
      )}
      {msg && (
        <div className="alert alert--success" style={{ marginTop: 12 }}>
          {msg}
        </div>
      )}

      <div className="me__grid">
        <div className="card me__panel card--flat">
          <h3 className="me__panelTitle">Informazioni personali</h3>

          <form className="me__form" onSubmit={handleSave} noValidate>
            <label className="me__label">
              Email
              <input
                className={`input ${fieldErrors.email ? "input--error" : ""}`}
                value={form.email}
                onChange={(e) => {
                  setField("email", e.target.value);
                  clearFieldError("email");
                }}
                autoComplete="email"
              />
            </label>

            <div className="me__row">
              <label className="me__label">
                Nome
                <input
                  className={`input ${fieldErrors.firstName ? "input--error" : ""}`}
                  value={form.firstName}
                  onChange={(e) => {
                    setField("firstName", e.target.value);
                    clearFieldError("firstName");
                  }}
                  autoComplete="given-name"
                />
              </label>

              <label className="me__label">
                Cognome
                <input
                  className={`input ${fieldErrors.lastName ? "input--error" : ""}`}
                  value={form.lastName}
                  onChange={(e) => {
                    setField("lastName", e.target.value);
                    clearFieldError("lastName");
                  }}
                  autoComplete="family-name"
                />
              </label>
            </div>

            <label className="me__label">
              Vecchia password (per cambiare password)
              <input
                className={`input ${fieldErrors.oldPassword ? "input--error" : ""}`}
                type="password"
                value={form.oldPassword}
                onChange={(e) => {
                  setField("oldPassword", e.target.value);
                  clearFieldError("oldPassword");
                }}
                autoComplete="current-password"
              />
            </label>

            <label className="me__label">
              Nuova password
              <input
                className={`input ${fieldErrors.newPassword ? "input--error" : ""}`}
                type="password"
                value={form.newPassword}
                onChange={(e) => {
                  setField("newPassword", e.target.value);
                  clearFieldError("newPassword");
                }}
                placeholder="Min 8 caratteri"
                autoComplete="new-password"
              />
            </label>

            <button className="btn btn--primary" type="submit" disabled={isSaving}>
              {isSaving ? "Salvataggio..." : "Salva modifiche"}
            </button>

            <Link to="/" className="btn btn--ghost">
              Torna alla Home
            </Link>
          </form>
        </div>

        <div className="card me__panel card--flat">
          <h3 className="me__panelTitle">Preferenze di marketing</h3>

          <div className="me__form">
            <label className="me__label">
              Piatti preferiti
              <input
                className="input"
                value={form.preferences.favoriteMealTypes}
                onChange={(e) => setPrefField("favoriteMealTypes", e.target.value)}
                placeholder="burger, pizza, salad..."
              />
            </label>

            <label className="me__checkbox">
              <input
                type="checkbox"
                checked={form.preferences.marketingOptIn}
                onChange={(e) => setPrefField("marketingOptIn", e.target.checked)}
              />
              <span> Tienimi aggiornato su offerte e promozioni</span>
            </label>

            <div className="me__divider" />

            <h3 className="me__panelTitle" style={{ marginTop: 0 }}>
              Metodo di pagamento
            </h3>

            <label className="me__label">
              Metodo
              <div className="me__segmented" role="radiogroup" aria-label="Payment method">
                <button
                  type="button"
                  role="radio"
                  aria-checked={form.payment.method === "card"}
                  className={`me__segBtn ${form.payment.method === "card" ? "is-active" : ""}`}
                  onClick={() => setPaymentField("method", "card")}
                >
                  Carta
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={form.payment.method === "prepaid"}
                  className={`me__segBtn ${form.payment.method === "prepaid" ? "is-active" : ""}`}
                  onClick={() => setPaymentField("method", "prepaid")}
                >
                  Prepagata
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={form.payment.method === "cash"}
                  className={`me__segBtn ${form.payment.method === "cash" ? "is-active" : ""}`}
                  onClick={() => setPaymentField("method", "cash")}
                >
                  Contanti
                </button>
              </div>
            </label>

            {isCardLike && (
              <>
                <div className="me__row">
                  <label className="me__label">
                    Circuito
                    <input
                      className={`input ${fieldErrors["payment.cardBrand"] ? "input--error" : ""}`}
                      value={form.payment.cardBrand}
                      onChange={(e) => {
                        setPaymentField("cardBrand", e.target.value);
                        clearFieldError("payment.cardBrand");
                      }}
                      placeholder="Visa, MasterCard..."
                    />
                  </label>

                  <label className="me__label">
                    Ultime 4 cifre
                    <input
                      className={`input ${fieldErrors["payment.cardLast4"] ? "input--error" : ""}`}
                      value={form.payment.cardLast4}
                      onChange={(e) => {
                        setPaymentField("cardLast4", e.target.value);
                        clearFieldError("payment.cardLast4");
                      }}
                      placeholder="1234"
                      inputMode="numeric"
                      maxLength={4}
                    />
                  </label>
                </div>

                <label className="me__label">
                  Intestatario
                  <input
                    className={`input ${fieldErrors["payment.holderName"] ? "input--error" : ""}`}
                    value={form.payment.holderName}
                    onChange={(e) => {
                      setPaymentField("holderName", e.target.value);
                      clearFieldError("payment.holderName");
                    }}
                    placeholder="Nome Cognome"
                  />
                </label>
              </>
            )}

            <div className="me__divider" />

            <div className="me__actionsRow">
              <button className="btn btn--ghost" type="button" onClick={handleLogout}>
                Logout
              </button>

              <button
                className="btn me__dangerBtn"
                type="button"
                onClick={() => setDangerOpen((v) => !v)}
              >
                Elimina account
              </button>
            </div>

            {dangerOpen && (
              <div className="me__dangerBox" style={{ marginTop: 10 }}>
                <p style={{ margin: 0, opacity: 0.9 }}>
                  Questa azione è irreversibile. Se hai ordini attivi, verrà bloccata.
                </p>

                <div className="me__dangerActions">
                  <button
                    className="btn btn--secondary"
                    type="button"
                    onClick={() => setDangerOpen(false)}
                  >
                    Annulla
                  </button>
                  <button
                    className="btn me__dangerConfirm"
                    type="button"
                    onClick={handleDeleteAccount}
                    disabled={deleteBusy}
                  >
                    {deleteBusy ? "Eliminazione..." : "Sì, elimina"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
