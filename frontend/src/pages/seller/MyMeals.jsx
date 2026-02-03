import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LuSearch, LuX, LuImageOff, LuFilter, LuArrowLeft } from "react-icons/lu";

import TopBar from "../../components/TopBar";
import { getMyCustomMealsApi } from "../../api/meals.api";
import "./MyMeals.css";

function normalizeString(v) {
  return String(v || "").trim().toLowerCase();
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

function uniqSorted(arr) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

export default function MyMeals() {
  const [allMeals, setAllMeals] = useState([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 24;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setError("");
      setLoading(true);
      try {
        const data = await getMyCustomMealsApi();
        if (!alive) return;

        setAllMeals(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setAllMeals([]);
        setError(e?.response?.data?.message || "Errore nel caricamento dei tuoi piatti.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const filteredMeals = useMemo(() => {
    const q = normalizeString(query);
    const cat = normalizeString(category);

    return allMeals
      .filter((m) => {
        const name = normalizeString(getMealName(m));
        const mealCat = normalizeString(getMealCategory(m));

        const matchesName = !q || name.includes(q);
        const matchesCat = !cat || mealCat === cat;

        return matchesName && matchesCat;
      })
      .sort((a, b) => {
        const catA = getMealCategory(a);
        const catB = getMealCategory(b);
        const byCat = catA.localeCompare(catB);
        if (byCat !== 0) return byCat;

        const nameA = getMealName(a);
        const nameB = getMealName(b);
        return nameA.localeCompare(nameB);
      });
  }, [allMeals, query, category]);

  const categories = useMemo(() => {
    return uniqSorted(filteredMeals.map((m) => getMealCategory(m)));
  }, [filteredMeals]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredMeals.length / pageSize));
  }, [filteredMeals.length]);

  useEffect(() => {
    setPage(1);
  }, [query, category]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedMeals = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMeals.slice(start, start + pageSize);
  }, [filteredMeals, page]);

  const grouped = useMemo(() => {
    const map = new Map();

    for (const m of pagedMeals) {
      const cat = getMealCategory(m);
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(m);
    }

    const cats = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
    return cats.map((cat) => ({
      category: cat,
      items: map.get(cat),
    }));
  }, [pagedMeals]);

  function clearCategory() {
    setCategory("");
  }

  function setCategoryFilter(nextCat) {
    setCategory(nextCat);
  }

  function getVisiblePages() {
    const maxButtons = 7;
    if (totalPages <= maxButtons) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages = [];
    const left = Math.max(1, page - 2);
    const right = Math.min(totalPages, page + 2);

    pages.push(1);
    if (left > 2) pages.push("…");
    for (let p = left; p <= right; p++) {
      if (p !== 1 && p !== totalPages) pages.push(p);
    }
    if (right < totalPages - 1) pages.push("…");
    pages.push(totalPages);

    return pages;
  }

  const visiblePages = useMemo(getVisiblePages, [page, totalPages]);

  return (
    <div className="page">
      <TopBar variant="brandOnly" />

      <div className="container listPage myMealsPage">
        <header className="listPage__header">
          <div>
            <h1 className="listPage__title">I miei piatti</h1>
            <p className="listPage__subtitle">Gestisci e visualizza tutti i tuoi piatti.</p>
          </div>

          <div className="mealsActions">
            <div className="menuSearch mealsActions__search">
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
                Filtro
              </button>

              {isFilterOpen ? (
                <div className="mealsFilter__menu card" role="menu">
                  <button
                    type="button"
                    className={`mealsFilter__item ${!category ? "is-active" : ""}`}
                    onClick={() => {
                      clearCategory();
                      setIsFilterOpen(false);
                    }}
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
                      onClick={() => {
                        setCategoryFilter(c);
                        setIsFilterOpen(false);
                      }}
                      title={c}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {error && <div className="alert alert--error listPage__error">{error}</div>}

        {loading ? (
          <div className="listPage__state">Caricamento...</div>
        ) : filteredMeals.length === 0 ? (
          <div className="listPage__state">Non hai ancora creato nessun piatto.</div>
        ) : (
          <>
            {category ? (
              <div className="mealsActiveFilter">
                <span className="mealsActiveFilter__label">Categoria:</span>
                <span className="mealsActiveFilter__value">{category}</span>
                <button type="button" className="mealsActiveFilter__clear" onClick={clearCategory} title="Rimuovi filtro">
                  <LuX aria-hidden />
                </button>
              </div>
            ) : null}

            <div className="mealsPage__scroll">
              {grouped.map((block) => (
                <section key={block.category} className="mealsCat">
                  <div className="mealsCat__title">{block.category}</div>

                  <div className="mealsCat__grid">
                    {block.items.map((m) => {
                      const id = getMealId(m);
                      if (!id) return null;

                      const name = getMealName(m);
                      const thumb = getMealThumb(m);

                      return (
                        <Link key={id} to={`/seller/meals/${id}/edit`} className="mealCardMini card">
                          <div className="mealCardMini__thumb">
                            {thumb ? (
                              <img src={thumb} alt={name} loading="lazy" />
                            ) : (
                              <div className="mealCardMini__ph">
                                <LuImageOff aria-hidden />
                              </div>
                            )}
                          </div>

                          <div className="mealCardMini__name" title={name}>
                            {name}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            {totalPages > 1 ? (
              <nav className="pager" aria-label="Paginazione piatti">
                <button
                  type="button"
                  className="pager__btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ←
                </button>

                <div className="pager__pages">
                  {visiblePages.map((p, idx) =>
                    p === "…" ? (
                      <span key={`dots-${idx}`} className="pager__dots">
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        className={`pager__page ${p === page ? "is-active" : ""}`}
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  className="pager__btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  →
                </button>
              </nav>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
