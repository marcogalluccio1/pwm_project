import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LuPencil, LuX, LuStore, LuChartBar, LuUtensilsCrossed } from "react-icons/lu";
import { useAuth } from "../../auth/useAuth";
import "../../styles/management.css";
import TopBar from "../../components/TopBar";

import {
  getMyRestaurantApi,
  updateMyRestaurantApi,
  getMyRestaurantStatsApi,
} from "../../api/restaurants.api";

function formatMoney(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(num);
}

export default function RestaurantManagement() {
  const { user } = useAuth();

  const [restaurant, setRestaurant] = useState(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [fieldErrors, setFieldErrors] = useState({});
  const msgTimer = useRef(null);

  const initialForm = useState(
    () => ({
      name: "",
      phone: "",
      address: "",
      city: "",
    }),
    []
  );

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    async function loadAll() {
      setLoadingRestaurant(true);
      setLoadingStats(true);
      setErr("");

      try {
        const r = await getMyRestaurantApi();
        setRestaurant(r || null);

        if (r) {
          setForm({
            name: r.name || "",
            phone: r.phone || "",
            address: r.address || "",
            city: r.city || "",
          });
        }
      } catch (e) {
        setRestaurant(null);
        setErr(e?.response?.data?.message || "Impossibile caricare il ristorante.");
      } finally {
        setLoadingRestaurant(false);
      }

      try {
        const s = await getMyRestaurantStatsApi();
        setStats(s || null);
      } catch {
        setStats(null);
      } finally {
        setLoadingStats(false);
      }
    }

    loadAll();
  }, []);

  useEffect(() => {
    if (!msg) return;
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(""), 4000);
    return () => {
      if (msgTimer.current) clearTimeout(msgTimer.current);
    };
  }, [msg]);

  function setField(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function clearFieldError(key) {
    setFieldErrors((prev) => {
      if (!prev?.[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function validate(payload) {
    const errors = {};
    if (!payload.name) errors.name = true;
    if (!payload.phone) errors.phone = true;
    if (!payload.address) errors.address = true;
    if (!payload.city) errors.city = true;

    if (payload.phone && payload.phone.trim().length < 6) errors.phone = true;

    setFieldErrors(errors);
    return Object.keys(errors).length > 0;
  }

  function handleCancelEdit() {
    if (restaurant) {
      setForm({
        name: restaurant.name || "",
        phone: restaurant.phone || "",
        address: restaurant.address || "",
        city: restaurant.city || "",
      });
    }
    setFieldErrors({});
    setErr("");
    setMsg("");
    setIsEditing(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const role = String(user?.role || "").toLowerCase();
    if (role !== "seller") {
      setErr("Solo un ristoratore può gestire il ristorante.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
    };

    if (validate(payload)) {
      setErr("Controlla i campi evidenziati in rosso.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await updateMyRestaurantApi(payload);
      setRestaurant(updated);
      setMsg("Ristorante aggiornato.");
      setIsEditing(false);
      setFieldErrors({});
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Errore durante il salvataggio.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="meLayout page">
      <TopBar variant="brandOnly" />

      <main className="meLayout__main">
        <div className="me__page">
          <div className="card me__panel card--flat">
            <h1 className="me__title">Gestione ristorante</h1>
            <p className="me__subtitle">Aggiorna i dati, gestisci il menù e controlla le statistiche</p>

            {err && <div className="alert alert--error">{err}</div>}
            {msg && <div className="alert alert--success">{msg}</div>}

            <div className="me__grid">
              {/* COLONNA SINISTRA: modifica dati */}
              <div className="me__colLeft">
                <div className="card me__panel card--flat">
                  <div className="me__panelHeader">
                    <h3 className="me__panelTitle">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                        <LuStore aria-hidden />
                        Dati ristorante
                      </span>
                    </h3>

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
                      aria-label={isEditing ? "Annulla modifica" : "Modifica dati ristorante"}
                      title={isEditing ? "Annulla" : "Modifica"}
                    >
                      <LuPencil aria-hidden />
                    </button>
                  </div>

                  <div className="me__panelDivider" style={{marginTop: -4}} />

                  {loadingRestaurant ? (
                    <p className="me__text">Caricamento...</p>
                  ) : (
                    <form
                      className={`me__form ${!isEditing ? "is-locked" : ""}`}
                      onSubmit={handleSave}
                      noValidate
                    >
                      <fieldset className="me__fieldset" disabled={!isEditing}>
                        <label className="me__label">
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

                        <label className="me__label">
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
                          />
                        </label>

                        <label className="me__label">
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

                        <label className="me__label">
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
                  )}
                </div>

                <Link to="/seller/restaurant/menu" className="me__restaurantSection" aria-label="Personalizza menù">
                  <LuUtensilsCrossed className="me__restaurantIconSvg" aria-hidden />
                  <div className="me__restaurantText">
                    <div className="me__restaurantTitle">Personalizza menù</div>
                    <div className="me__restaurantSubtitle">Seleziona i piatti e i prezzi</div>
                  </div>
                </Link>

                <div className="me__footerBar me__footerBar--out">
                  <div className="me__footerLeft">
                    <Link to="/me" className="btn btn--ghost">
                      Torna al tuo profilo
                    </Link>
                  </div>
                  <div className="me__footerRight">
                    <Link to="/" className="btn btn--ghost">
                      Home
                    </Link>
                  </div>
                </div>
              </div>

              <div className="card me__panel card--flat">
                <div className="me__panelHeader">
                  <h3 className="me__panelTitle">
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                      <LuChartBar aria-hidden />
                      Statistiche
                    </span>
                  </h3>
                </div>

                <div className="me__panelDivider" />

                {loadingStats ? (
                  <p className="me__text">Caricamento statistiche...</p>
                ) : !stats ? (
                  <p className="me__text">Statistiche non disponibili.</p>
                ) : (
                  <div className="me__actions">
                    {"totalOrders" in stats || "totalRevenue" in stats || "avgOrderValue" in stats ? (
                      <>
                        <div className="card card--flat" style={{ padding: 14 }}>
                          <div style={{ fontWeight: 900, opacity: 0.9 }}>Ordini totali</div>
                          <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 6 }}>
                            {stats.totalOrders ?? "—"}
                          </div>
                        </div>

                        <div className="card card--flat" style={{ padding: 14 }}>
                          <div style={{ fontWeight: 900, opacity: 0.9 }}>Incasso totale</div>
                          <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 6 }}>
                            {formatMoney(stats.totalRevenue)}
                          </div>
                        </div>

                        <div className="card card--flat" style={{ padding: 14 }}>
                          <div style={{ fontWeight: 900, opacity: 0.9 }}>Valore medio ordine</div>
                          <div style={{ fontSize: 28, fontWeight: 1000, marginTop: 6 }}>
                            {formatMoney(stats.avgOrderValue)}
                          </div>
                        </div>
                      </>
                    ) : (
                      <pre
                        style={{
                          margin: 0,
                          padding: 14,
                          borderRadius: 14,
                          border: "1px solid rgba(255,255,255,0.14)",
                          background: "rgba(255,255,255,0.06)",
                          overflow: "auto",
                          maxHeight: 380,
                        }}
                      >
                        {JSON.stringify(stats, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
