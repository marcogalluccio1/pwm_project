import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LuArrowLeft, LuSave, LuTrash2, LuX } from "react-icons/lu";

import TopBar from "../../components/TopBar";
import { useAuth } from "../../auth/useAuth";
import { getMealByIdApi, updateCustomMealApi, deleteCustomMealApi } from "../../api/meals.api";

import "../../styles/management.css";
import "./EditMeal.css";

function parseIngredients(input) {
  return String(input || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getMealName(m) {
  return m?.nameIt || m?.name || "Senza nome";
}

function getMealCategory(m) {
  return m?.categoryIt || m?.category || "Altro";
}

function getMealThumb(m) {
  return m?.thumbnailUrl || m?.strMealThumb || "";
}

export default function EditMeal() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, isLoading } = useAuth();

  const isLogged = !!user;
  const isSeller = user?.role === "seller";

  const [mealLoading, setMealLoading] = useState(true);
  const [mealLoadError, setMealLoadError] = useState("");

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
  const [isDeleting, setIsDeleting] = useState(false);

  const [thumbBroken, setThumbBroken] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);

  const msgTimer = useRef(null);

  useEffect(() => {
    if (isLoading) return;

    if (!isLogged) {
      navigate("/login", { state: { from: `/seller/meals/${id}/edit` }, replace: true });
      return;
    }
    if (!isSeller) navigate(-1);
  }, [isLoading, isLogged, isSeller, navigate, id]);

  useEffect(() => {
    if (!id || isLoading || !isSeller) return;

    let alive = true;

    async function load() {
      setMealLoadError("");
      setMealLoading(true);
      try {
        const meal = await getMealByIdApi(id);
        if (!alive) return;

        const name = getMealName(meal);
        const category = getMealCategory(meal);
        const thumb = getMealThumb(meal);
        const ingredients = Array.isArray(meal?.ingredients) ? meal.ingredients : [];

        setForm({
          name,
          category,
          thumbnailUrl: thumb,
          ingredientsText: ingredients.join(", "),
        });
      } catch (e) {
        if (!alive) return;
        setMealLoadError(e?.response?.data?.message || "Errore nel caricamento del piatto.");
      } finally {
        if (alive) setMealLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [id, isLoading, isSeller]);

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
      await updateCustomMealApi(id, payload);
      setMsg("Piatto aggiornato.");
      setFieldErrors({});
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Errore durante l'aggiornamento del piatto.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setErr("");
    setMsg("");

    try {
      setIsDeleting(true);
      await deleteCustomMealApi(id);
      setMsg("Piatto eliminato.");
      setTimeout(() => navigate(-1), 1500);
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Errore durante l'eliminazione del piatto.");
      setIsDeleting(false);
    }
  }

  function handleReset() {
    setErr("");
    setMsg("");
    setFieldErrors({});
  }

  if (isLoading || mealLoading) {
    return (
      <div className="meLayout page">
        <TopBar variant="brandOnly" />
        <main className="meLayout__main">
          <div className="me__page">
            <div className="card me__panel card--flat">
              <div className="me__title">Modifica piatto</div>
              <p className="me__text">Caricamento...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (mealLoadError) {
    return (
      <div className="meLayout page">
        <TopBar variant="brandOnly" />
        <main className="meLayout__main">
          <div className="me__page">
            <div className="card me__panel card--flat">
              <div className="me__title">Modifica piatto</div>
              <div className="alert alert--error">{mealLoadError}</div>
              <button className="btn btn--ghost" type="button" onClick={() => navigate("/seller/meals")}>
                <LuArrowLeft aria-hidden />
                Indietro
              </button>
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
            <div className="editMeal__header">
              <div>
                <h1 className="me__title editMeal__title">Modifica piatto</h1>
                <p className="me__subtitle editMeal__subtitle">Aggiorna le informazioni del tuo piatto.</p>
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
                <div className="editMeal__thumbRow">
                  <input
                    className={`input editMeal__thumbInput ${fieldErrors.thumbnailUrl ? "input--error" : ""}`}
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

                  <div className="editMeal__thumbBox" aria-label="Anteprima immagine" title="Anteprima immagine">
                    {form.thumbnailUrl && !thumbBroken ? (
                      <img
                        className="editMeal__thumbImg"
                        src={form.thumbnailUrl}
                        alt="Anteprima"
                        onError={() => setThumbBroken(true)}
                      />
                    ) : (
                      <span className="editMeal__thumbPlaceholder">
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
                <button className="btn btn--primary" type="submit" disabled={isSaving || isDeleting}>
                  <span className="editMeal__btnInline">
                    <LuSave aria-hidden />
                    {isSaving ? "Aggiornamento..." : "Salva modifiche"}
                  </span>
                </button>

                <button
                  className="btn btn--ghost"
                  type="button"
                  onClick={handleReset}
                  disabled={isSaving || isDeleting}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <LuX aria-hidden />
                    Annulla
                  </span>
                </button>
              </div>

              <button
                className="btn me__dangerBtn editMeal__deleteBtn"
                type="button"
                onClick={() => setDangerOpen(true)}
                disabled={isSaving || isDeleting}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <LuTrash2 aria-hidden />
                  Elimina piatto
                </span>
              </button>
            </form>

            {dangerOpen && (
              <div className="me__dangerBox">
                <p>Sei sicuro di voler eliminare "{form.name}"? Questa azione non può essere annullata.</p>
                <div className="me__dangerActions">
                  <button className="btn btn--secondary" onClick={() => setDangerOpen(false)} type="button" disabled={isDeleting}>
                    Annulla
                  </button>
                  <button
                    className="btn me__dangerConfirm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    type="button"
                  >
                    {isDeleting ? "Eliminazione..." : "Elimina"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
