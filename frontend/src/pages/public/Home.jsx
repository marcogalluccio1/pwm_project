import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TopBar from "../../components/TopBar";
import { useAuth } from "../../auth/useAuth";
import { listMealsApi } from "../../api/meals.api";
import "./Home.css";

function normalizeMealPreview(m) {
  if (!m) return null;
  const id = String(m?._id || m?.id || "");
  const thumbnailUrl = String(m?.thumbnailUrl || m?.strMealThumb || "");
  return { id, thumbnailUrl };
}

export default function Home() {
  const { user } = useAuth();
  const [featuredMeal, setFeaturedMeal] = useState({ id: "", thumbnailUrl: "" });

  const role = String(user?.role || "").toLowerCase();
  const isSeller = role === "seller";
  const isCustomer = role === "customer";

  useEffect(() => {
    let alive = true;

    async function loadRandomMeal() {
      try {
        const meals = await listMealsApi();
        const list = Array.isArray(meals) ? meals : [];
        if (!alive) return;

        if (list.length === 0) {
          setFeaturedMeal({ id: "", thumbnailUrl: "" });
          return;
        }

        const pick = list[Math.floor(Math.random() * list.length)];
        const norm = normalizeMealPreview(pick);
        setFeaturedMeal(norm || { id: "", thumbnailUrl: "" });
      } catch {
        if (!alive) return;
        setFeaturedMeal({ id: "", thumbnailUrl: "" });
      }
    }

    loadRandomMeal();
    return () => {
      alive = false;
    };
  }, []);

  const rightCard = useMemo(() => {
    if (!user) {
      const to = featuredMeal?.id ? `/meals/${featuredMeal.id}` : "/meals";
      return {
        to,
        title: "Piatto in evidenza",
        text: "Scopri un piatto scelto casualmente dal nostro menù.",
        cta: "Scopri il piatto →",
        imageUrl: featuredMeal?.thumbnailUrl || "",
        showImage: true,
      };
    }

    if (isSeller) {
      return {
        to: "/seller/restaurant",
        title: "Il mio ristorante",
        text: "Gestisci i dati del ristorante, il menù e le statistiche.",
        cta: "Vai alla gestione →",
        imageUrl: "",
        showImage: false,
      };
    }

    if (isCustomer) {
      return {
        to: "/restaurants",
        title: "Ordina ora",
        text: "Scegli un ristorante, aggiungi i piatti e completa l’ordine.",
        cta: "Vai all’ordine →",
        imageUrl: "",
        showImage: false,
      };
    }

    return {
      to: "/restaurants",
      title: "Ristoranti",
      text: "Scopri tutti i ristoranti disponibili e i loro menù.",
      cta: "Vai ai ristoranti →",
      imageUrl: "",
      showImage: false,
    };
  }, [user, isSeller, isCustomer, featuredMeal]);

  return (
    <div className="home page">
      <TopBar />

      <main className="home__hero">
        <div className="home__hero-text">
          <h1>
            Il tuo fast food
            <span> più veloce</span>
          </h1>
          <p>Ordina online e ritira quando è pronto.</p>

          {!user ? (
            <div className="home__cta">
              <Link to="/login" className="btn btn--primary btn--lg">
                Accedi
              </Link>
              <Link to="/register" className="btn btn--secondary btn--lg">
                Crea account
              </Link>
            </div>
          ) : null}
        </div>

        <Link to={rightCard.to} className="home__restaurants-card">
          <div className="home__restaurants-image">
            {rightCard.showImage && rightCard.imageUrl ? (
              <>
                <img src={rightCard.imageUrl} alt={rightCard.title} loading="lazy" />
                <div className="home__featured-badge">IN EVIDENZA</div>
              </>
            ) : (
              <div className="home__restaurants-imagePh" aria-hidden />
            )}
          </div>


          <h3 className="home__restaurants-title">{rightCard.title}</h3>
          <p className="home__restaurants-text">{rightCard.text}</p>

          <div className="home__restaurants-cta">
            <span />
            <span aria-hidden>{rightCard.cta}</span>
          </div>
        </Link>
      </main>
    </div>
  );
}
