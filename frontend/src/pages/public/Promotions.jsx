import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { LuChevronLeft, LuChevronRight, LuImageOff } from "react-icons/lu";

import TopBar from "../../components/TopBar";
import { listMealsApi } from "../../api/meals.api";
import "./Promotions.css";

function getMealId(m) {
  return String(m?._id || m?.id || "");
}

function getMealName(m) {
  return m?.nameIt || m?.name || "Senza nome";
}

function getMealThumb(m) {
  return m?.thumbnailUrl || m?.strMealThumb || "";
}

function toTs(v) {
  const t = new Date(v || 0).getTime();
  return Number.isFinite(t) ? t : 0;
}

export default function Promotions() {
  const [meals, setMeals] = useState([]);
  const [active, setActive] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isPaused, setIsPaused] = useState(false);
  const [animDir, setAnimDir] = useState("next");
  const [isAnimating, setIsAnimating] = useState(false);

  const timerRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setError("");
      setLoading(true);
      try {
        const data = await listMealsApi();
        if (!alive) return;

        const list = data?.meals ?? data;
        setMeals(Array.isArray(list) ? list : []);
      } catch (e) {
        if (!alive) return;
        setMeals([]);
        setError(e?.response?.data?.message || "Errore nel caricamento delle novità.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, []);

  const latest5 = useMemo(() => {
    const arr = Array.isArray(meals) ? [...meals] : [];
    arr.sort((a, b) => toTs(b?.updatedAt) - toTs(a?.updatedAt));
    return arr.slice(0, 5);
  }, [meals]);

  useEffect(() => {
    setActive(0);
  }, [latest5.length]);

  function startAnim(dir) {
    setAnimDir(dir);
    setIsAnimating(true);
    if (animRef.current) clearTimeout(animRef.current);
    animRef.current = setTimeout(() => setIsAnimating(false), 460);
  }

  function goPrev() {
    if (!latest5.length || isAnimating) return;
    startAnim("prev");
    setActive((i) => {
      const n = latest5.length;
      return (i - 1 + n) % n;
    });
  }

  function goNext() {
    if (!latest5.length || isAnimating) return;
    startAnim("next");
    setActive((i) => {
      const n = latest5.length;
      return (i + 1) % n;
    });
  }

  useEffect(() => {
    if (!latest5.length) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      if (isAnimating) return;
      startAnim("next");
      setActive((i) => {
        const n = latest5.length;
        return (i + 1) % n;
      });
    }, 4000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [latest5.length, isPaused, isAnimating]);

  const stack = useMemo(() => {
    if (!latest5.length) return [];
    const out = [];
    for (let k = 0; k < latest5.length; k++) {
      const idx = (active + k) % latest5.length;
      out.push({ meal: latest5[idx], pos: k });
    }
    return out;
  }, [latest5, active]);

  const maxDepth = 4;

  return (
    <div className="page">
      <TopBar />

      <div className="container promotionsPage">
        <header className="promotionsHeader">
          <div>
            <h1 className="promotionsHeader__title">Novità</h1>
            <p className="promotionsHeader__subtitle">Scorri gli ultimi piatti aggiunti.</p>
          </div>
        </header>

        {error ? <div className="alert alert--error promotionsError">{error}</div> : null}

        {loading ? (
          <div className="promotionsState">Caricamento...</div>
        ) : latest5.length === 0 ? (
          <div className="promotionsState">Nessuna novità disponibile.</div>
        ) : (
          <>
            <div
              className="album"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onFocusCapture={() => setIsPaused(true)}
              onBlurCapture={() => setIsPaused(false)}
              aria-label="Album novità"
            >
              <button
                type="button"
                className="btn btn--secondary album__nav album__nav--left"
                onClick={goPrev}
                disabled={isAnimating}
                aria-label="Precedente"
              >
                <LuChevronLeft aria-hidden />
              </button>

              <div className="album__stage">
                {stack.map(({ meal, pos }) => {
                  const id = getMealId(meal) || `pos-${pos}`;
                  const name = getMealName(meal);
                  const thumb = getMealThumb(meal);

                  const depth = Math.min(pos, maxDepth);
                  const isTop = pos === 0;

                  const animClass =
                    isTop && isAnimating ? (animDir === "next" ? "is-exiting-right" : "is-exiting-left") : "";

                  return (
                    <Link
                      key={`${id}-${pos}`}
                      to={`/meals/${id}`}
                      className={`albumImg depth-${depth} ${isTop ? "is-top" : ""} ${animClass}`}
                      style={{ zIndex: 50 - pos }}
                      aria-label={`Apri ${name}`}
                      title={name}
                      tabIndex={isTop ? 0 : -1}
                    >
                      {isTop ? (
                        <span className="albumBadge" title={name}>
                          {name}
                        </span>
                      ) : null}

                      {thumb ? (
                        <img src={thumb} alt={name} loading="lazy" />
                      ) : (
                        <div className="albumImg__ph">
                          <LuImageOff aria-hidden />
                          <span>Nessuna immagine</span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>

              <button
                type="button"
                className="btn btn--secondary album__nav album__nav--right"
                onClick={goNext}
                disabled={isAnimating}
                aria-label="Successivo"
              >
                <LuChevronRight aria-hidden />
              </button>
            </div>

            <div className="albumDots" aria-label="Indicatori album">
              {latest5.map((m, idx) => {
                const id = getMealId(m) || `idx-${idx}`;
                const isActive = idx === active;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`albumDot ${isActive ? "is-active" : ""}`}
                    onClick={() => {
                      if (idx === active || isAnimating) return;
                      startAnim(idx > active ? "next" : "prev");
                      setActive(idx);
                    }}
                    title={getMealName(m)}
                    disabled={isAnimating}
                  />
                );
              })}
            </div>

            <div className="userMenu__divider" />
            <div className="promotionsHeader__title">Promozioni</div>

            <div className="promotionsHeader__subtitle">In arrivo!</div>
            
          </>
        )}
      </div>
    </div>
  );
}
