import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LuArrowLeft, LuImageOff, LuTag, LuStore } from "react-icons/lu";

import TopBar from "../../components/TopBar";
import { getMealByIdApi } from "../../api/meals.api";
import { listRestaurantsApi } from "../../api/restaurants.api";

import "./MealDetails.css";

function normalizeMeal(data) {
  if (!data) return null;

  const id = data?._id || data?.id;
  const name = data?.nameIt || data?.name || "Senza nome";
  const category = data?.categoryIt || data?.category || "Altro";
  const thumbnailUrl = data?.thumbnailUrl || data?.strMealThumb || "";
  const ingredients = Array.isArray(data?.ingredients) ? data.ingredients.filter(Boolean) : [];
  const isGlobal = Boolean(data?.isGlobal);
  const createdBySellerId = data?.createdBySellerId ? String(data.createdBySellerId) : "";

  return {
    id: String(id || ""),
    name,
    category,
    thumbnailUrl,
    ingredients,
    isGlobal,
    createdBySellerId,
  };
}

export default function MealDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [meal, setMeal] = useState(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setErr("");
      setRestaurantName("");

      try {
        const data = await getMealByIdApi(id);
        if (!alive) return;

        const norm = normalizeMeal(data);
        setMeal(norm);

        if (norm && !norm.isGlobal && norm.createdBySellerId) {
          try {
            const res = await listRestaurantsApi();
            const list = res?.restaurants ?? res;
            const restaurants = Array.isArray(list) ? list : [];

            const found = restaurants.find((r) => String(r?.sellerId || "") === norm.createdBySellerId);
            if (found?.name) setRestaurantName(String(found.name));
          } catch {
            // optional
          }
        }
      } catch (e) {
        if (!alive) return;
        setMeal(null);
        setErr(e?.response?.data?.message || "Impossibile caricare il piatto.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    if (!id) {
      setErr("ID piatto non valido.");
      setLoading(false);
      return () => {};
    }

    load();
    return () => {
      alive = false;
    };
  }, [id]);

  const restaurantButton = (() => {
    if (!meal) return null;

    if (!meal.isGlobal && restaurantName) {
      return {
        label: `Specialità di: ${restaurantName}`,
        to: `/restaurants?restaurant=${encodeURIComponent(restaurantName)}`,
      };
    }

    return {
      label: "Vedi ristoranti",
      to: "/restaurants",
    };
  })();

  return (
    <div className="mealPage page">
      <TopBar />

      <main className="mealPage__wrap">
        <div className="mealPage__top">
          <button type="button" className="btn btn--ghost mealPage__back" onClick={() => navigate(-1)}>
            <LuArrowLeft aria-hidden />
            Indietro
          </button>

          <div className="mealPage__crumbs">
            <Link to="/" className="mealPage__crumb">
              Home
            </Link>
            <span className="mealPage__crumbSep">/</span>
            <Link to="/restaurants" className="mealPage__crumb">
              Ristoranti
            </Link>
            <span className="mealPage__crumbSep">/</span>
            <span className="mealPage__crumb is-current">Dettaglio piatto</span>
          </div>
        </div>

        {loading ? (
          <div className="card mealCard">
            <div className="mealCard__loading">Caricamento...</div>
          </div>
        ) : err ? (
          <div className="card mealCard">
            <div className="alert alert--error">{err}</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              <Link to="/" className="btn btn--primary">
                Vai alla Home
              </Link>
              <button className="btn btn--ghost" type="button" onClick={() => window.location.reload()}>
                Riprova
              </button>
            </div>
          </div>
        ) : !meal?.id ? (
          <div className="card mealCard">
            <div className="alert alert--error">Piatto non trovato.</div>
          </div>
        ) : (
          <div className="mealGrid">
            <section className="card mealHero">
              <div className="mealHero__media">
                {meal.thumbnailUrl ? (
                  <img src={meal.thumbnailUrl} alt={meal.name} loading="lazy" />
                ) : (
                  <div className="mealHero__ph">
                    <LuImageOff aria-hidden />
                    <span>Nessuna immagine</span>
                  </div>
                )}
              </div>

              <div className="mealHero__info">
                <div className="mealHero__badges">
                  <span className="mealBadge">
                    <LuTag aria-hidden />
                    {meal.category}
                  </span>
                </div>

                <h1 className="mealHero__title">{meal.name}</h1>

                <div className="mealHero__ingredients">
                  <div className="mealHero__ingredientsTitle">Ingredienti</div>

                  {meal.ingredients.length === 0 ? (
                    <div className="mealHero__ingredientsEmpty">Non disponibili al momento.</div>
                  ) : (
                    <div className="mealChips">
                      {meal.ingredients.map((ing) => (
                        <span key={ing} className="mealChip" title={ing}>
                          {ing}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mealHero__actions">
                  {restaurantButton ? (
                    <Link to={restaurantButton.to} className="btn btn--secondary btn--lg">
                      <LuStore aria-hidden />
                      {restaurantButton.label}
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>

            <section className="card mealSection">
              <h2 className="mealSection__title">Informazioni</h2>
              <div className="mealSection__divider" />

              <div className="mealInfoGrid">
                <div className="mealInfoRow">
                  <div className="mealInfoKey">Valori nutrizionali</div>
                  <div className="mealInfoVal">Attualmente non disponibili</div>
                </div>

                <div className="mealInfoRow">
                  <div className="mealInfoKey">Allergeni</div>
                  <div className="mealInfoVal">Attualmente non disponibili</div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
