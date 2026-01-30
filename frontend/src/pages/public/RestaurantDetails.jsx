import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";
import { LuArrowLeft, LuFilter, LuImageOff, LuMinus, LuPlus, LuSearch, LuX } from "react-icons/lu";

import TopBar from "../../components/TopBar";
import { useAuth } from "../../auth/useAuth";

import { getRestaurantByIdApi, getRestaurantMenuApi } from "../../api/restaurants.api";
import "./RestaurantDetails.css";

import cover1 from "../../assets/cover1.jpg";
import cover2 from "../../assets/cover2.jpg";
import cover3 from "../../assets/cover3.jpg";
import cover4 from "../../assets/cover4.jpg";

const RESTAURANT_COVERS = [cover1, cover2, cover3, cover4];

function normalizeString(v) {
  return String(v || "").trim().toLowerCase();
}

function uniqSorted(arr) {
  return Array.from(new Set(arr.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getMealId(m) {
  return String(m?._id || m?.id || "");
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

function getMealPriceNumber(m) {
  const raw =
    typeof m?.price === "number"
      ? m.price
      : typeof m?.price === "string"
      ? Number(m.price)
      : typeof m?.priceCents === "number"
      ? m.priceCents / 100
      : 0;

  if (!Number.isFinite(raw)) return 0;
  return raw;
}

function formatEUR(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return "€0.00";
  return `€${v.toFixed(2)}`;
}

function hashStringToIndex(str, modulo) {
  const s = String(str || "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return modulo > 0 ? h % modulo : 0;
}

export default function RestaurantDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isCustomer = user?.role === "customer";
  const isSeller = user?.role === "seller";
  const isLogged = Boolean(user);

  const [restaurant, setRestaurant] = useState(null);
  const [meals, setMeals] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(50);
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 50 });

  const [orderMode, setOrderMode] = useState(false);
  const [cart, setCart] = useState({});

  const restaurantCover = useMemo(() => {
    const idx = hashStringToIndex(id, RESTAURANT_COVERS.length);
    return RESTAURANT_COVERS[idx] || RESTAURANT_COVERS[0];
  }, [id]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setError("");
      setLoading(true);
      try {
        const [r, m] = await Promise.all([getRestaurantByIdApi(id), getRestaurantMenuApi(id)]);
        if (!alive) return;

        const rawMenu = Array.isArray(m?.menu) ? m.menu : [];

        const mealsList = rawMenu
          .map((it) => {
            const meal = it?.meal;
            if (!meal) return null;
            return { ...meal, price: it?.price };
          })
          .filter(Boolean);

        const restaurantObj = r?.restaurant ?? r ?? null;

        setRestaurant(restaurantObj);
        setMeals(mealsList);

        const prices = mealsList.map(getMealPriceNumber).filter((p) => Number.isFinite(p));
        const minP = prices.length ? Math.min(...prices) : 0;
        const maxP = prices.length ? Math.max(...prices) : 50;

        const safeMin = Math.floor(minP * 100) / 100;
        const safeMax = Math.ceil(maxP * 100) / 100;

        setPriceBounds({ min: safeMin, max: Math.max(safeMax, safeMin + 0.1) });
        setPriceMin(safeMin);
        setPriceMax(Math.max(safeMax, safeMin + 0.1));
      } catch (e) {
        if (!alive) return;
        setRestaurant(null);
        setMeals([]);
        setError(e?.response?.data?.message || "Errore nel caricamento del ristorante.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (id) load();

    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!isCustomer) setOrderMode(false);
  }, [isCustomer]);

  const categories = useMemo(() => uniqSorted(meals.map((m) => getMealCategory(m))), [meals]);

  const filteredMeals = useMemo(() => {
    const q = normalizeString(query);
    const cat = normalizeString(category);

    const minP = Math.min(priceMin, priceMax);
    const maxP = Math.max(priceMin, priceMax);

    return meals
      .filter((m) => {
        const name = normalizeString(getMealName(m));
        const mealCat = normalizeString(getMealCategory(m));
        const price = getMealPriceNumber(m);

        const matchesName = !q || name.includes(q);
        const matchesCat = !cat || mealCat === cat;
        const matchesPrice = price >= minP && price <= maxP;

        return matchesName && matchesCat && matchesPrice;
      })
      .sort((a, b) => {
        const cA = getMealCategory(a);
        const cB = getMealCategory(b);
        const byCat = cA.localeCompare(cB);
        if (byCat !== 0) return byCat;
        return getMealName(a).localeCompare(getMealName(b));
      });
  }, [meals, query, category, priceMin, priceMax]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const m of filteredMeals) {
      const c = getMealCategory(m);
      if (!map.has(c)) map.set(c, []);
      map.get(c).push(m);
    }
    const cats = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
    return cats.map((c) => ({ category: c, items: map.get(c) }));
  }, [filteredMeals]);

  function clearCategory() {
    setCategory("");
    setIsFilterOpen(false);
  }

  function addOne(mealId) {
    setCart((prev) => {
      const next = { ...prev };
      next[mealId] = clamp((next[mealId] || 0) + 1, 0, 99);
      return next;
    });
  }

  function removeOne(mealId) {
    setCart((prev) => {
      const next = { ...prev };
      const v = clamp((next[mealId] || 0) - 1, 0, 99);
      if (v <= 0) delete next[mealId];
      else next[mealId] = v;
      return next;
    });
  }

  function setQty(mealId, qty) {
    const q = clamp(Number(qty) || 0, 0, 99);
    setCart((prev) => {
      const next = { ...prev };
      if (q <= 0) delete next[mealId];
      else next[mealId] = q;
      return next;
    });
  }

  const cartCount = useMemo(() => Object.values(cart).reduce((sum, v) => sum + (Number(v) || 0), 0), [cart]);

  const cartTotal = useMemo(() => {
    const byId = new Map(meals.map((m) => [getMealId(m), m]));
    let total = 0;
    for (const [mealId, qty] of Object.entries(cart)) {
      const m = byId.get(mealId);
      if (!m) continue;
      total += getMealPriceNumber(m) * (Number(qty) || 0);
    }
    return total;
  }, [cart, meals]);

  function onToggleOrder() {
    if (!isLogged) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    if (!isCustomer) return;
    setOrderMode(true);
  }

  function onCancelOrder() {
    setOrderMode(false);
    setCart({});
  }

  function onGoToCheckout() {
    if (!isCustomer) return;

    const itemCount = Object.values(cart).reduce((sum, v) => sum + (Number(v) || 0), 0);
    if (itemCount <= 0) return;

    navigate("/checkout", {
      state: {
        restaurantId: id,
        cart,
      },
    });
  }

  const hasPriceFilter =
    Math.round(priceMin * 100) !== Math.round(priceBounds.min * 100) ||
    Math.round(priceMax * 100) !== Math.round(priceBounds.max * 100);

  function resetPrice() {
    setPriceMin(priceBounds.min);
    setPriceMax(priceBounds.max);
  }

  const checkoutDisabled = !isCustomer || cartCount <= 0;

  return (
    <div className="page">
      <TopBar />

      <div className="page__wrap">
        <div className="page__top">
          <button type="button" className="btn btn--ghost page__back" onClick={() => navigate(-1)}>
            <LuArrowLeft aria-hidden />
            Indietro
          </button>

          <div className="page__crumbs">
            <Link to="/" className="page__crumb">
              Home
            </Link>
            <span className="page__crumbSep">/</span>
            <Link to="/restaurants" className="page__crumb">
              Ristoranti
            </Link>
            <span className="page__crumbSep">/</span>
            <span className="page__crumb is-current">Dettaglio ristorante</span>
          </div>
        </div>

        {error ? <div className="alert alert--error">{error}</div> : null}

        {loading ? (
          <div className="restaurantGrid">
            <div className="card restaurantCard">Caricamento...</div>
          </div>
        ) : !restaurant ? (
          <div className="restaurantGrid">
            <div className="card restaurantCard">Ristorante non trovato.</div>
          </div>
        ) : (
          <div className="restaurantGrid">
            <header className="card restaurantCard restaurantHero">
              <div className="restaurantHero__media">
                {restaurantCover ? (
                  <img src={restaurantCover} alt={restaurant?.name || "Ristorante"} loading="lazy" />
                ) : (
                  <div className="restaurantHero__ph">
                    <LuImageOff aria-hidden />
                    <span>Nessuna immagine</span>
                  </div>
                )}
              </div>

              <div className="restaurantHero__info">
                <div className="restaurantHero__badges">
                  {restaurant?.category ? <span className="pill">{restaurant.category}</span> : null}
                </div>

                <h1 className="restaurantHero__name">{restaurant?.name || "Ristorante"}</h1>

                <div className="restaurantHero__details">
                  {restaurant?.city ? (
                    <div className="detailRow">
                      <span className="detailLabel">Città</span>
                      <span className="detailValue">{restaurant.city}</span>
                    </div>
                  ) : null}

                  {restaurant?.address ? (
                    <div className="detailRow">
                      <span className="detailLabel">Indirizzo</span>
                      <span className="detailValue">{restaurant.address}</span>
                    </div>
                  ) : null}

                  {restaurant?.phone ? (
                    <div className="detailRow">
                      <span className="detailLabel">Telefono</span>
                      <span className="detailValue">{restaurant.phone}</span>
                    </div>
                  ) : null}
                </div>

                {restaurant?.description ? <p className="restaurantHero__desc">{restaurant.description}</p> : null}
              </div>
            </header>

            {!isSeller ? (
              <section className="card restaurantCard orderCard">
                <div>
                  <div className="orderCard__title">Ordine</div>
                  <div className="orderCard__subtitle">
                    {isLogged
                      ? isCustomer
                        ? "Aggiungi piatti e controlla il carrello."
                        : "Solo i clienti possono ordinare."
                      : "Accedi per ordinare."}
                  </div>
                </div>

                <div className="orderCard__right">
                  {!orderMode ? (
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={onToggleOrder}
                      disabled={isLogged && !isCustomer}
                    >
                      {isLogged ? "Ordina" : "Accedi per ordinare"}
                    </button>
                  ) : (
                    <>
                      <button type="button" className="btn btn--secondary" onClick={onCancelOrder} title="Annulla">
                        <LuX aria-hidden />
                        Annulla
                      </button>

                      <button
                        type="button"
                        className="btn btn--primary"
                        onClick={onGoToCheckout}
                        disabled={checkoutDisabled}
                        title={checkoutDisabled ? "Aggiungi almeno un piatto" : "Vai al checkout"}
                      >
                        Vai al checkout
                      </button>
                    </>
                  )}

                  {isCustomer && orderMode ? (
                    <div className="orderSummary">
                      <div className="orderSummary__row">
                        <span>Articoli</span>
                        <strong>{cartCount}</strong>
                      </div>
                      <div className="orderSummary__row">
                        <span>Totale</span>
                        <strong>{formatEUR(cartTotal)}</strong>
                      </div>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            <section className="card restaurantCard">
              <div className="menuSection__header">
                <div>
                  <h2 className="menuSection__title">Menù</h2>
                  <p className="menuSection__subtitle">Cerca, filtra per categoria e imposta un range di prezzo.</p>
                </div>

                <div className="menuTools">
                  <div className="menuSearch menuTools__search">
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

                  <div className="mealsFilter">
                    <button
                      type="button"
                      className={`mealsFilter__btn btn btn--secondary ${isFilterOpen ? "is-open" : ""}`}
                      onClick={() => setIsFilterOpen((v) => !v)}
                      aria-haspopup="menu"
                      aria-expanded={isFilterOpen}
                    >
                      <LuFilter aria-hidden />
                      Filtri
                    </button>

                    {isFilterOpen ? (
                      <div className="mealsFilter__menu card" role="menu">
                        <div className="filterBlock">
                          <div className="filterBlock__head">
                            <div className="filterBlock__title">Categoria</div>
                            {category ? (
                              <button type="button" className="linkBtn" onClick={clearCategory}>
                                Rimuovi
                              </button>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            className={`mealsFilter__item ${!category ? "is-active" : ""}`}
                            onClick={() => setCategory("")}
                          >
                            Tutte le categorie
                          </button>

                          <div className="mealsFilter__divider" />

                          {categories.map((c) => (
                            <button
                              key={c}
                              type="button"
                              className={`mealsFilter__item ${
                                normalizeString(c) === normalizeString(category) ? "is-active" : ""
                              }`}
                              onClick={() => setCategory(c)}
                              title={c}
                            >
                              {c}
                            </button>
                          ))}
                        </div>

                        <div className="mealsFilter__divider" />

                        <div className="filterBlock">
                          <div className="filterBlock__head">
                            <div className="filterBlock__title">Prezzo</div>
                            {hasPriceFilter ? (
                              <button type="button" className="linkBtn" onClick={resetPrice}>
                                Reset
                              </button>
                            ) : null}
                          </div>

                          <div className="priceRange__values">
                            <span>{formatEUR(Math.min(priceMin, priceMax))}</span>
                            <span>{formatEUR(Math.max(priceMin, priceMax))}</span>
                          </div>

                          <div className="priceRange">
                            <input
                              type="range"
                              min={priceBounds.min}
                              max={priceBounds.max}
                              step={0.1}
                              value={priceMin}
                              onChange={(e) => setPriceMin(Number(e.target.value))}
                              aria-label="Prezzo minimo"
                            />
                            <input
                              type="range"
                              min={priceBounds.min}
                              max={priceBounds.max}
                              step={0.1}
                              value={priceMax}
                              onChange={(e) => setPriceMax(Number(e.target.value))}
                              aria-label="Prezzo massimo"
                            />
                          </div>
                        </div>

                        <div className="mealsFilter__divider" />

                        <button type="button" className="btn btn--secondary w100" onClick={() => setIsFilterOpen(false)}>
                          Chiudi
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {filteredMeals.length === 0 ? (
                <div className="listPage__state">Nessun piatto trovato.</div>
              ) : (
                <div>
                  {grouped.map((block) => (
                    <section key={block.category} className="mealsCat">
                      <div className="mealsCat__title">{block.category}</div>

                      <div className="mealsCat__grid">
                        {block.items.map((m) => {
                          const mealId = getMealId(m);
                          if (!mealId) return null;

                          const name = getMealName(m);
                          const thumb = getMealThumb(m);
                          const price = getMealPriceNumber(m);
                          const qty = cart[mealId] || 0;

                          return (
                            <div key={mealId} className="mealCardMini card">
                              <Link to={`/meals/${mealId}`} className="mealCardMini__link" aria-label={name} title={name}>
                                <div className="mealCardMini__thumb">
                                  {thumb ? (
                                    <img src={thumb} alt={name} loading="lazy" />
                                  ) : (
                                    <div className="mealCardMini__ph">
                                      <LuImageOff aria-hidden />
                                    </div>
                                  )}
                                </div>

                                <div className="mealCardMini__row">
                                  <div className="mealCardMini__name" title={name}>
                                    {name}
                                  </div>
                                  <div className="mealCardMini__price">{formatEUR(price)}</div>
                                </div>
                              </Link>

                              {isCustomer && orderMode ? (
                                <div className="mealOrderControls">
                                  <button
                                    type="button"
                                    className="iconBtn"
                                    onClick={() => removeOne(mealId)}
                                    disabled={qty <= 0}
                                    aria-label="Diminuisci quantità"
                                  >
                                    <LuMinus aria-hidden />
                                  </button>

                                  <input
                                    className="qtyInput"
                                    type="number"
                                    min={0}
                                    max={99}
                                    step={1}
                                    value={qty}
                                    onChange={(e) => setQty(mealId, e.target.value)}
                                    aria-label="Quantità"
                                  />

                                  <button type="button" className="iconBtn" onClick={() => addOne(mealId)} aria-label="Aumenta quantità">
                                    <LuPlus aria-hidden />
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
