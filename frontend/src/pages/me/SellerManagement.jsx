import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuStore, LuPencil, LuX } from "react-icons/lu";
import { useAuth } from "../../auth/useAuth";
import { updateMeApi, deleteMeApi } from "../../api/auth.api";
import { getMyRestaurantApi } from "../../api/restaurants.api";

export default function SellerMe() {
  const { user, refreshMe, logout } = useAuth();
  const navigate = useNavigate();

  const initial = useMemo(
    () => ({
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      vatNumber: user?.vatNumber || "",
      oldPassword: "",
      newPassword: "",
    }),
    [user]
  );

  const [form, setForm] = useState(initial);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const [restaurant, setRestaurant] = useState(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [dangerOpen, setDangerOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [isEditing, setIsEditing] = useState(false);

  const msgTimer = useRef(null);

  useEffect(() => {
    setForm(initial);
    setFieldErrors({});
    setIsEditing(false);
  }, [initial]);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const data = await getMyRestaurantApi();
        setRestaurant(data || null);
      } catch {
        setRestaurant(null);
      } finally {
        setLoadingRestaurant(false);
      }
    }
    loadRestaurant();
  }, []);

  useEffect(() => {
    if (!msg) return;
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(""), 4000);
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

  function validate(payload) {
    const errors = {};
    if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) errors.email = true;
    if (!payload.firstName) errors.firstName = true;
    if (!payload.lastName) errors.lastName = true;
    if (!payload.vatNumber) errors.vatNumber = true;

    if (payload.oldPassword || payload.password) {
      if (!payload.oldPassword) errors.oldPassword = true;
      if (!payload.password || payload.password.length < 8) errors.newPassword = true;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length > 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const payload = {
      email: form.email.trim().toLowerCase(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      vatNumber: form.vatNumber.trim(),
    };

    if (form.oldPassword || form.newPassword) {
      payload.oldPassword = form.oldPassword;
      payload.password = form.newPassword;
    }

    if (validate(payload)) {
      setErr("Controlla i campi evidenziati in rosso.");
      return;
    }

    setIsSaving(true);
    try {
      await updateMeApi(payload);
      setMsg("Profilo aggiornato.");
      setForm((f) => ({ ...f, oldPassword: "", newPassword: "" }));
      await refreshMe();
      setIsEditing(false);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Errore durante il salvataggio.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setDeleteBusy(true);
    try {
      await deleteMeApi();
      logout();
      navigate("/", { replace: true });
    } catch (error) {
      const status = error?.response?.status;
      const message = error?.response?.data?.message;

      if (status === 409) setErr("Impossibile eliminare l’account perché il tuo ristorante ha degli ordini attivi.");
      else if (status === 401) setErr("Sessione scaduta. Effettua di nuovo il login.");
      else setErr(message || "Errore durante l'eliminazione account.");
    } finally {
      setDeleteBusy(false);
      setDangerOpen(false);
    }
  }

  function handleCancelEdit() {
    setForm(initial);
    setFieldErrors({});
    setIsEditing(false);
    setErr("");
    setMsg("");
  }

  return (
    <div className="card me__panel card--flat">
      <h1 className="me__title">Profilo ristoratore</h1>
      <p className="me__subtitle">Gestisci il tuo account e il tuo ristorante</p>

      {err && <div className="alert alert--error">{err}</div>}
      {msg && <div className="alert alert--success">{msg}</div>}

      <div className="me__grid">
        <div className="me__colLeft">
          <div className="card me__panel card--flat">
            <div className="me__panelHeader">
              <h3 className="me__panelTitle">Dati personali</h3>

              <button
                type="button"
                className={`me__editBtn ${isEditing ? "is-active" : ""}`}
                onClick={() => {
                  if (isEditing) {
                    handleCancelEdit();
                    return;
                  }
                  setErr("");
                  setMsg("");
                  setIsEditing(true);
                }}
                aria-label={isEditing ? "Annulla modifica" : "Modifica dati personali"}
                title={isEditing ? "Annulla" : "Modifica"}
              >
                <LuPencil aria-hidden />
              </button>
            </div>

            <div className="me__panelDivider" />

            <form
              className={`me__form ${!isEditing ? "is-locked" : ""}`}
              onSubmit={handleSave}
              noValidate
            >
              <fieldset className="me__fieldset" disabled={!isEditing}>
                <fieldset className="me__fieldset" disabled={!isEditing}>
                  <label className="me__label">
                    Email
                    <input
                      className={`input ${fieldErrors.email ? "input--error" : ""}`}
                      type="email"
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
                        type="text"
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
                        type="text"
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
                    Partita IVA
                    <input
                      className={`input ${fieldErrors.vatNumber ? "input--error" : ""}`}
                      type="text"
                      value={form.vatNumber}
                      onChange={(e) => {
                        setField("vatNumber", e.target.value);
                        clearFieldError("vatNumber");
                      }}
                      autoComplete="off"
                    />
                  </label>

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
                </fieldset>

              </fieldset>

              <div className={`me__editActions ${isEditing ? "is-open" : ""}`}>
                <button className="btn btn--primary" type="submit" disabled={isSaving}>
                  {isSaving ? "Salvataggio..." : "Salva modifiche"}
                </button>

                <button className="btn btn--ghost" type="button" onClick={handleCancelEdit}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <LuX aria-hidden />
                    Annulla
                  </span>
                </button>
              </div>
            </form>
          </div>

          <div className="me__footerBar me__footerBar--out">
            <div className="me__footerLeft">
              <Link to="/" className="btn btn--ghost">
                Torna alla Home
              </Link>
            </div>

            <div className="me__footerRight">
              <button
                className="btn btn--ghost"
                type="button"
                onClick={() => {
                  logout();
                  navigate("/", { replace: true });
                }}
              >
                Logout
              </button>

              <button className="btn me__dangerBtn" onClick={() => setDangerOpen(true)} type="button">
                Elimina account
              </button>
            </div>
          </div>

          {dangerOpen && (
            <div className="me__dangerBox">
              <p>Confermi eliminazione account?</p>
              <div className="me__dangerActions">
                <button className="btn btn--secondary" onClick={() => setDangerOpen(false)} type="button">
                  Annulla
                </button>
                <button
                  className="btn me__dangerConfirm"
                  onClick={handleDelete}
                  disabled={deleteBusy}
                  type="button"
                >
                  {deleteBusy ? "Eliminazione..." : "Elimina"}
                </button>
              </div>
            </div>
          )}
        </div>

        <Link
          to={restaurant ? "/seller/restaurant" : "/seller/restaurant/create"}
          className="me__restaurantSection"
          aria-label="Vai al ristorante"
        >
          <LuStore className="me__restaurantIconSvg" aria-hidden />
          <div className="me__restaurantText">
            <div className="me__restaurantTitle">
              {loadingRestaurant ? "Caricamento..." : restaurant ? restaurant.name : "Registra il tuo ristorante"}
            </div>
            <div className="me__restaurantSubtitle">
              {loadingRestaurant
                ? "Recupero informazioni..."
                : restaurant
                ? "Gestisci info, menù e ordini"
                : "Non hai ancora un ristorante associato"}
            </div>
          </div>
        </Link>
      </div>

    </div>
  );
}
