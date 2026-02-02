import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuArrowLeft, LuPencil, LuPlus, LuX, LuSearch } from "react-icons/lu";

import TopBar from "../../components/TopBar";
import { listSelectableMealsApi } from "../../api/meals.api";
import { getMyRestaurantMenuApi, setMyRestaurantMenuApi } from "../../api/restaurants.api";

import "./RestaurantMenu.css";

function getMealId(meal) {
  return meal?._id || meal?.id;
}

function normalizeCategory(meal) {
  return meal?.categoryIt || meal?.category || "Altro";
}

function normalizeName(meal) {
  return meal?.nameIt || meal?.name || "Senza nome";
}

function mealDetailsPath(id) {
  return `/meals/${id}`;
}

function rebuildSelectionAndPrices(menuIndex, allMeals) {
  const nextSelected = new Set();
  const nextPrices = {};

  for (const [id, it] of menuIndex.entries()) {
    nextSelected.add(id);
    nextPrices[id] = Number(it?.price ?? 0);
  }

  for (const m of allMeals) {
    const id = String(getMealId(m) || "");
    if (!id) continue;

    if (typeof nextPrices[id] === "undefined") {
      const p = Number(m?.basePrice);
      if (Number.isFinite(p)) nextPrices[id] = p;
    }
  }

  return { nextSelected, nextPrices };
}

export default function RestaurantMenu() {
  const navigate = useNavigate();

  const [allMeals, setAllMeals] = useState([]);
  const [loadingMeals, setLoadingMeals] = useState(true);

  const [myMenu, setMyMenu] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [pricesById, setPricesById] = useState({});

  const [query, setQuery] = useState("");

  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const msgTimer = useRef(null);

  useEffect(() => {
    async function load() {
      setErr("");
      try {
        const [meals, menuRes] = await Promise.all([listSelectableMealsApi(), getMyRestaurantMenuApi()]);
        setAllMeals(Array.isArray(meals) ? meals : meals?.meals || meals?.items || []);
        setMyMenu(Array.isArray(menuRes?.menu) ? menuRes.menu : []);
      } catch (e) {
        setErr(e?.response?.data?.message || "Errore durante il caricamento del menù.");
      } finally {
        setLoadingMeals(false);
        setLoadingMenu(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!msg) return;
    if (msgTimer.current) clearTimeout(msgTimer.current);
    msgTimer.current = setTimeout(() => setMsg(""), 4000);
  }, [msg]);

  const menuIndex = useMemo(() => {
    const map = new Map();
    for (const it of myMenu) {
      const id = getMealId(it?.meal);
      if (!id) continue;
      map.set(String(id), it);
    }
    return map;
  }, [myMenu]);

  useEffect(() => {
    const { nextSelected, nextPrices } = rebuildSelectionAndPrices(menuIndex, allMeals);
    setSelectedIds(nextSelected);
    setPricesById(nextPrices);
  }, [menuIndex, allMeals]);


  const filteredMeals = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allMeals;
    return allMeals.filter((m) => normalizeName(m).toLowerCase().includes(q));
  }, [allMeals, query]);

  const visibleMeals = useMemo(() => {
    if (isEditing) return filteredMeals;
    return filteredMeals.filter((m) => selectedIds.has(String(getMealId(m) || "")));
  }, [filteredMeals, selectedIds, isEditing]);

  const mealsByCategory = useMemo(() => {
    const groups = new Map();
    for (const meal of visibleMeals) {
      const cat = normalizeCategory(meal);
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(meal);
    }

    const cats = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
    return cats.map((cat) => ({
      category: cat,
      meals: groups
        .get(cat)
        .slice()
        .sort((a, b) => normalizeName(a).localeCompare(normalizeName(b))),
    }));
  }, [visibleMeals]);

  function toggleMeal(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        
        setPricesById((prevPrices) => {
          if (typeof prevPrices[id] === "undefined") {
            return {
              ...prevPrices,
              [id]: 0.1,
            };
          }
          return prevPrices;
        });
      }

      return next;
    });
  }


  function setPrice(id, value) {
    const num = Number(value);
    const fixed = Number.isFinite(num) ? Math.round(num * 100) / 100 : 0.1;

    setPricesById((prev) => ({
      ...prev,
      [id]: fixed,
    }));
  }


  function handleCancelEdit() {
    setIsEditing(false);
    setErr("");
    setMsg("");

    const { nextSelected, nextPrices } = rebuildSelectionAndPrices(menuIndex, allMeals);
    setSelectedIds(nextSelected);
    setPricesById(nextPrices);
  }


  async function handleSave() {
    setErr("");
    setMsg("");

    const items = Array.from(selectedIds).map((id) => ({
      mealId: id,
      price: Number(pricesById[id] ?? 0),
    }));


    try {
      await setMyRestaurantMenuApi(items);
      const menuRes = await getMyRestaurantMenuApi();
      setMyMenu(Array.isArray(menuRes?.menu) ? menuRes.menu : []);
      setIsEditing(false);
      setMsg("Menù aggiornato.");
    } catch (e) {
      setErr(e?.response?.data?.message || "Errore durante il salvataggio del menù.");
    }
  }

  function openMealInNewTab(e, id) {
    e.preventDefault();
    e.stopPropagation();
    window.open(mealDetailsPath(id), "_blank", "noopener,noreferrer");
  }

  const isLoading = loadingMeals || loadingMenu;

  return (
    <div className="menuPage">
      <TopBar variant="brandOnly" />

      <div className="menuPage__content">
        <div className="menuPage__container card me__panel card--flat">
          <div className="menuPage__header">
            <div>
              <h1 className="me__title">Personalizzazione menù</h1>
              <p className="me__subtitle">Seleziona i piatti in vendita e aggiorna i prezzi</p>
            </div>

            <div className="menuPage__headerActions">
              <button className="btn btn--ghost" type="button" onClick={() => navigate(-1)}>
              <LuArrowLeft aria-hidden />
              Indietro
              </button>
              <button
                type="button"
                className={`me__editBtn ${isEditing ? "is-active" : ""}`}
                onClick={() => {
                  if (isEditing) handleCancelEdit();
                  else {
                    setErr("");
                    setMsg("");
                    setIsEditing(true);
                  }
                }}
                aria-label={isEditing ? "Annulla modifica menù" : "Modifica menù"}
                title={isEditing ? "Annulla" : "Modifica"}
              >
                <LuPencil aria-hidden />
              </button>
            </div>
          </div>

          {err && <div className="alert alert--error">{err}</div>}
          {msg && <div className="alert alert--success">{msg}</div>}

          <div className="me__panelDivider" />

          <div className="menuPage__grid">
            <div className="card me__panel card--flat menuCard">
              <div className="menuCard__head">
                <h3 className="me__panelTitle">
                  {isEditing ? "Piatti disponibili" : "Piatti inseriti nel menù"}
                </h3>

                <div className="menuCard__rightHead">
                  <div className="menuSearch">
                    <LuSearch aria-hidden />
                    <input
                      className="input menuSearch__input"
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Cerca per nome..."
                      aria-label="Cerca piatti per nome"
                    />
                    {query ? (
                      <button
                        type="button"
                        className="menuSearch__clear"
                        onClick={() => setQuery("")}
                        aria-label="Pulisci ricerca"
                        title="Pulisci"
                      >
                        <LuX aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="menuCard__divider" />

              {isLoading ? (
                <div className="menuCard__loading">Caricamento...</div>
              ) : visibleMeals.length === 0 ? (
                <div className="menuCard__loading">
                  {isEditing ? "Nessun piatto disponibile." : "Non hai ancora inserito piatti nel menù."}
                </div>
              ) : (
                <div className="menuCard__scroll">
                  {mealsByCategory.map((block) => (
                    <section key={block.category} className="menuCat">
                      <div className="menuCat__title">{block.category}</div>

                      <div className="menuCat__grid">
                        {block.meals.map((meal) => {
                          const id = String(getMealId(meal) || "");
                          if (!id) return null;

                          const checked = selectedIds.has(id);
                          const name = normalizeName(meal);
                          const thumb = meal?.thumbnailUrl || meal?.strMealThumb;

                          return (
                            <label key={id} className={`menuItem ${!isEditing ? "is-locked" : ""}`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!isEditing}
                                onChange={() => toggleMeal(id)}
                              />

                              <button
                                type="button"
                                className="menuItem__main"
                                onClick={(e) => openMealInNewTab(e, id)}
                                title="Apri dettagli piatto"
                                aria-label={`Apri dettagli: ${name}`}
                              >
                                <div className="menuItem__thumb">
                                  {thumb ? <img src={thumb} alt={name} loading="lazy" /> : <div className="menuItem__ph" />}
                                </div>

                                <div className="menuItem__name" title={name}>
                                  {name}
                                </div>
                              </button>

                              <div className={`menuItem__priceWrap ${checked ? "is-visible" : ""}`}>
                                <span className="menuItem__priceLabel">Prezzo: €</span>
                                <input
                                  className="input menuItem__priceInput"
                                  type="number"
                                  step="0.10"
                                  min="0.10"
                                  inputMode="decimal"
                                  value={Number(pricesById[id] ?? 0.1).toFixed(2)}
                                  disabled={!isEditing || !checked}
                                  onChange={(e) => setPrice(id, e.target.value)}
                                />
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}

              <div className={`menuCard__footer ${isEditing ? "is-open" : ""}`}>
                <div className="menuCard__footerLeft">
                  <button className="btn btn--primary" type="button" onClick={handleSave}>
                    Salva modifiche
                  </button>

                  <button className="btn btn--ghost" type="button" onClick={handleCancelEdit}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <LuX aria-hidden />
                      Annulla
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  className="btn btn--secondary menuCard__addBtn"
                  onClick={() => navigate("/seller/restaurant/menu/new")}
                  title="Crea un nuovo piatto"
                  aria-label="Crea un nuovo piatto"
                >
                  <LuPlus aria-hidden />
                  Crea un nuovo piatto
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
