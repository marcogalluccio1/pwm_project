import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LuPencil, LuX, LuStore, LuPackage, LuUtensilsCrossed } from "react-icons/lu";
import { useAuth } from "../../auth/useAuth";
import "../../styles/management.css";
import TopBar from "../../components/TopBar";
import { getMyRestaurantApi, updateMyRestaurantApi } from "../../api/restaurants.api";
import { getRestaurantOrdersApi } from "../../api/orders.api";

function formatMoney(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(num);
}


function formatDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function sumItems(items) {
  return (items || []).reduce((s, it) => s + (Number(it?.quantity) || 0), 0);
}

function getCustomerName(o) {
  const firstName = o?.customerId?.firstName || o?.customer?.firstName || "";
  const lastName = o?.customerId?.lastName || o?.customer?.lastName || "";
  const full = `${firstName} ${lastName}`.trim();
  return full || o?.customerId?.email || o?.customer?.email || "Cliente";
}

function getOrderId(o) {
  return String(o?._id || o?.id || "");
}

export default function RestaurantManagement() {
  const { user, isLoading } = useAuth();

  const isLogged = !!user;
  const isSeller = user?.role === "seller";

  const [restaurant, setRestaurant] = useState(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);

  const [loadingNextOrders, setLoadingNextOrders] = useState(true);
  const [nextOrders, setNextOrders] = useState([]);

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
    if (isLoading) return;
    if (!isLogged || !isSeller) return;

    async function loadAll() {
      setLoadingRestaurant(true);
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

        try {
          setLoadingNextOrders(true);
          const resOrders = await getRestaurantOrdersApi();
          const listOrders = resOrders?.orders || resOrders || [];
          const base = Array.isArray(listOrders) ? [...listOrders] : [];

          const toServe = base.filter((o) => ["ordered", "preparing"].includes(o?.status));
          toServe.sort((a, b) => {
            const ta = new Date(a?.estimatedReadyAt || 0).getTime();
            const tb = new Date(b?.estimatedReadyAt || 0).getTime();
            if (ta !== tb) return ta - tb;
            const ca = new Date(a?.createdAt || 0).getTime();
            const cb = new Date(b?.createdAt || 0).getTime();
            return ca - cb;
          });

          setNextOrders(toServe.slice(0, 6));
        } catch {
          setNextOrders([]);
        } finally {
          setLoadingNextOrders(false);
        }
      } catch (e) {
        setRestaurant(null);
        setErr(e?.response?.data?.message || "Impossibile caricare il ristorante.");
      } finally {
        setLoadingRestaurant(false);
      }
    }

    loadAll();
  }, [isLoading, isLogged, isSeller]);

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

              <div className="me__col me__col--right">
                <div className="card me__panel card--flat">
                  <div className="me__panelHeader">
                    <h3 className="me__panelTitle">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                        <LuPackage aria-hidden />
                        Ordini
                      </span>
                    </h3>
                  </div>

                  <div className="me__panelDivider" />

                  {loadingNextOrders ? (
                    <p className="me__text">Caricamento ordini...</p>
                  ) : (nextOrders || []).length === 0 ? (
                    <p className="me__text">Nessun ordine da servire.</p>
                  ) : (
                    <div className="me__actions">
                      {(nextOrders || []).map((o) => (
                        <div key={getOrderId(o)} className="card card--flat" style={{ padding: 14 }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 10,
                              alignItems: "baseline",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: 1000,
                                opacity: 0.9,
                                minWidth: 0,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                              title={getCustomerName(o)}
                            >
                              {getCustomerName(o)}
                            </div>

                            <div style={{ fontWeight: 1100, opacity: 0.9 }}>{formatMoney(o?.total)}</div>
                          </div>

                          <div
                            style={{
                              marginTop: 6,
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 10,
                              alignItems: "center",
                              flexWrap: "wrap",
                            }}
                          >
                            <div style={{ fontWeight: 900, opacity: 0.85 }}>Orario previsto: {formatDateTime(o?.estimatedReadyAt)}</div>
                            <div style={{ fontWeight: 900, opacity: 0.85 }}>Articoli: {sumItems(o?.items)}</div>
                          </div>
                        </div>
                      ))}

                      <Link to="/seller/orders" className="btn btn--ghost" style={{ justifyContent: "center" }}>
                        Visualizza tutti gli ordini
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
