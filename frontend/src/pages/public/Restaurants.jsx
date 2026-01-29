import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LuSearch, LuX } from "react-icons/lu";

import TopBar from "../../components/TopBar";
import { listRestaurantsApi } from "../../api/restaurants.api";
import "../../styles/searchPage.css";

function normalizeString(v) {
  return String(v || "").trim().toLowerCase();
}

function buildCityAddress(r) {
  const city = String(r?.city || "").trim();
  const address = String(r?.address || "").trim();
  if (city && address) return `${city}, ${address}`;
  return city || address || "—";
}

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 18;

  async function load(qRaw) {
    setError("");
    setLoading(true);
    try {
      const q = String(qRaw || "").trim();

      const data = await listRestaurantsApi({
        name: q || undefined,
        city: q || undefined,
      });

      const list = data?.restaurants ?? data;
      setRestaurants(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Errore nel caricamento dei ristoranti.");
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load("");
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const filtered = useMemo(() => {
    const q = normalizeString(query);
    if (!q) return restaurants;

    return restaurants.filter((r) => {
      const name = normalizeString(r?.name);
      const city = normalizeString(r?.city);
      return name.includes(q) || city.includes(q);
    });
  }, [restaurants, query]);

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filtered.length / pageSize));
  }, [filtered.length]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pagedRestaurants = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

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
      <TopBar />

      <div className="container listPage">
        <header className="listPage__header">
          <div>
            <h1 className="listPage__title">Ristoranti</h1>
            <p className="listPage__subtitle">Ricerca per nome o città.</p>
          </div>

          <div className="listPage__search">
            <div className="menuSearch">
              <LuSearch aria-hidden />
              <input
                className="input menuSearch__input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca per nome o città..."
                aria-label="Cerca ristoranti per nome o città"
              />
              {query ? (
                <button
                  type="button"
                  className="menuSearch__clear"
                  onClick={() => {
                    setQuery("");
                    load("");
                  }}
                  aria-label="Pulisci ricerca"
                  title="Pulisci"
                >
                  <LuX aria-hidden />
                </button>
              ) : (
                <span style={{ width: 30, height: 30 }} aria-hidden />
              )}
            </div>
          </div>
        </header>

        {error && <div className="alert alert--error listPage__error">{error}</div>}

        {loading ? (
          <div className="listPage__state">Caricamento...</div>
        ) : filtered.length === 0 ? (
          <div className="listPage__state">Nessun ristorante trovato.</div>
        ) : (
          <>
            <div className="listPage__grid">
              {pagedRestaurants.map((r) => {
                const id = r?._id || r?.id;
                const title = r?.name || "Ristorante";
                const meta = buildCityAddress(r);

                return (
                  <Link key={id} to={`/restaurants/${id}`} className="listItem card">
                    <div className="listItem__main">
                      <div className="listItem__title" title={title}>
                        {title}
                      </div>
                      <div className="listItem__meta" title={meta}>
                        {meta}
                      </div>
                    </div>

                    <div className="listItem__arrow" aria-hidden>
                      →
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 ? (
              <nav className="pager" aria-label="Paginazione ristoranti">
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
