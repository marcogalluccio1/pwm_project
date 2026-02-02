import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuArrowLeft, LuPlus, LuX } from "react-icons/lu";

import TopBar from "../../components/TopBar";
import { useAuth } from "../../auth/useAuth";
import { createCustomMealApi } from "../../api/meals.api";

import "../../styles/management.css";
import "./NewMeal.css";

function parseIngredients(input) {
  return String(input || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function NewMeal() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const isLogged = !!user;
  const isSeller = user?.role === "seller";

  const [form, setForm] = useState({
    name: "",
    category: "",
    thumbnailUrl: "",
    ingredientsText: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [thumbBroken, setThumbBroken] = useState(false);

  const msgTimer = useRef(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isLogged) {
      navigate("/login", { state: { from: "/seller/meals/new" }, replace: true });
      return;
    }
    if (!isSeller) navigate(-1);
  }, [isLoading, isLogged, isSeller, navigate]);

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
    if (!payload.category) errors.category = true;
    if (!payload.thumbnailUrl) errors.thumbnailUrl = true;
    if (!Array.isArray(payload.ingredients) || payload.ingredients.length === 0) errors.ingredientsText = true;

    setFieldErrors(errors);
    return Object.keys(errors).length > 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      thumbnailUrl: form.thumbnailUrl.trim(),
      ingredients: parseIngredients(form.ingredientsText),
    };

    if (validate(payload)) {
      setErr("Controlla i campi evidenziati in rosso.");
      return;
    }

    try {
      setIsSaving(true);
      const res = await createCustomMealApi(payload);
      const created = res?.meal || res;

      setMsg(created?.name ? `Piatto creato: ${created.name}` : "Piatto creato.");

      setThumbBroken(false);
      setForm({
        name: "",
        category: "",
        thumbnailUrl: "",
        ingredientsText: "",
      });
      setFieldErrors({});
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Errore durante la creazione del piatto.");
    } finally {
      setIsSaving(false);
    }
  }

  function handleReset() {
    setErr("");
    setMsg("");
    setFieldErrors({});
    setThumbBroken(false);
    setForm({
      name: "",
      category: "",
      thumbnailUrl: "",
      ingredientsText: "",
    });
  }

  if (isLoading) {
    return (
      <div className="meLayout page">
        <TopBar variant="brandOnly" />
        <main className="meLayout__main">
          <div className="me__page">
            <div className="card me__panel card--flat">
              <div className="me__title">Nuovo piatto</div>
              <p className="me__text">Caricamento...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="meLayout page">
      <TopBar variant="brandOnly" />

      <main className="meLayout__main">
        <div className="me__page">
          <div className="card me__panel card--flat">
            <div className="newMeal__header">
              <div>
                <h1 className="me__title newMeal__title">Nuovo piatto</h1>
                <p className="me__subtitle newMeal__subtitle">Crea un piatto personalizzato per il tuo ristorante.</p>
              </div>
                <button className="btn btn--ghost" type="button" onClick={() => navigate(-1)}>
                <LuArrowLeft aria-hidden />
                Indietro
                </button>
            </div>


            {err && <div className="alert alert--error">{err}</div>}
            {msg && <div className="alert alert--success">{msg}</div>}

            <div className="me__panelDivider" />

            <form className="me__form" onSubmit={handleSubmit} noValidate>
              <label className="me__label">
                Nome piatto
                <input
                  className={`input ${fieldErrors.name ? "input--error" : ""}`}
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setField("name", e.target.value);
                    clearFieldError("name");
                  }}
                  placeholder="Es. Bacon Burger"
                  autoComplete="off"
                />
              </label>

              <label className="me__label">
                Categoria
                <input
                  className={`input ${fieldErrors.category ? "input--error" : ""}`}
                  type="text"
                  value={form.category}
                  onChange={(e) => {
                    setField("category", e.target.value);
                    clearFieldError("category");
                  }}
                  placeholder="Es. Beef, Vegan, Dessert..."
                  autoComplete="off"
                />
              </label>

              <label className="me__label">
                URL immagine
                <div className="newMeal__thumbRow">
                  <input
                    className={`input newMeal__thumbInput ${fieldErrors.thumbnailUrl ? "input--error" : ""}`}
                    type="url"
                    value={form.thumbnailUrl}
                    onChange={(e) => {
                      setField("thumbnailUrl", e.target.value);
                      clearFieldError("thumbnailUrl");
                      setThumbBroken(false);
                    }}
                    placeholder="https://..."
                    autoComplete="off"
                  />

                  <div className="newMeal__thumbBox" aria-label="Anteprima immagine" title="Anteprima immagine">
                    {form.thumbnailUrl && !thumbBroken ? (
                      <img
                        className="newMeal__thumbImg"
                        src={form.thumbnailUrl}
                        alt="Anteprima"
                        onError={() => setThumbBroken(true)}
                      />
                    ) : (
                      <span className="newMeal__thumbPlaceholder">
                        {form.thumbnailUrl ? "Immagine non valida" : "Anteprima"}
                      </span>
                    )}
                  </div>
                </div>
              </label>

              <label className="me__label">
                Ingredienti (separati da virgola)
                <input
                  className={`input ${fieldErrors.ingredientsText ? "input--error" : ""}`}
                  type="text"
                  value={form.ingredientsText}
                  onChange={(e) => {
                    setField("ingredientsText", e.target.value);
                    clearFieldError("ingredientsText");
                  }}
                  placeholder="Es. pane, bacon, cheddar, salsa..."
                  autoComplete="off"
                />
              </label>

              <div className="me__editActions is-open">
                <button className="btn btn--primary" type="submit" disabled={isSaving}>
                  <span className="newMeal__btnInline">
                    <LuPlus aria-hidden />
                    {isSaving ? "Creazione..." : "Crea piatto"}
                  </span>
                </button>

                <button className="btn btn--ghost" type="button" onClick={handleReset} disabled={isSaving}>
                  <span className="newMeal__btnInline">
                    <LuX aria-hidden />
                    Svuota
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
