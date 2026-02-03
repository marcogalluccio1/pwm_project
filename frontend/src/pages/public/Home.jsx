import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LuClock, LuMapPin, LuShieldCheck, LuUtensilsCrossed } from "react-icons/lu";

import TopBar from "../../components/TopBar";
import { useAuth } from "../../auth/useAuth";
import { listMealsApi } from "../../api/meals.api";
import "./Home.css";

function normalizeMealPreview(m) {
  if (!m) return null;
  const id = String(m?._id || m?.id || "");
  const thumbnailUrl = String(m?.thumbnailUrl || m?.strMealThumb || "");
  const name = String(m?.name || m?.strMealName || "");
  return { id, thumbnailUrl, name };
}

function getWelcomeName(user) {
  const first = String(user?.firstName || "").trim();
  return first || String(user?.email || "").trim() || "utente";
}

export default function Home() {
  const { user } = useAuth();
  const [featuredMeal, setFeaturedMeal] = useState({ id: "", thumbnailUrl: "", name: "" });

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
          setFeaturedMeal({ id: "", thumbnailUrl: "", name: "" });
          return;
        }

        const pick = list[Math.floor(Math.random() * list.length)];
        const norm = normalizeMealPreview(pick);
        setFeaturedMeal(norm || { id: "", thumbnailUrl: "", name: "" });
      } catch {
        if (!alive) return;
        setFeaturedMeal({ id: "", thumbnailUrl: "", name: "" });
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
      const mealName = featuredMeal?.name ? featuredMeal.name : "i nostri piatti";
      return {
        to,
        title: "Piatto in evidenza",
        text: `Scopri il piatto in evidenza: ${mealName}`,
        cta: "Scopri il piatto →",
        imageUrl: featuredMeal?.thumbnailUrl || "",
        showImage: true,
        badge: "IN EVIDENZA",
      };
    }

    if (isSeller) {
      return {
        to: "/seller/orders",
        title: "Gestione ordini",
        text: "Visualizza la coda degli ordini e le statistiche del ruo ristorante",
        cta: "Vai alla gestione ordini→",
        imageUrl: "/src/assets/seller_home_image.png",
        showImage: true
      };
    }

    if (isCustomer) {
      return {
        to: "/restaurants",
        title: "Ordina ora",
        text: "Scegli un ristorante, aggiungi i piatti e completa l’ordine.",
        cta: "Vai ai ristoranti →",
        imageUrl: "/src/assets/customer_home_image.png",
        showImage: true
      };
    }

    return {
      to: "/restaurants",
      title: "Scopri i ristoranti",
      text: "Esplora i ristoranti disponibili e guarda i menu.",
      cta: "Vai ai ristoranti →",
      imageUrl: "",
      showImage: false,
      badge: "",
    };
  }, [user, isSeller, isCustomer, featuredMeal]);

  const welcome = user ? `Benvenuto, ${getWelcomeName(user)}!` : "";

  const favoriteCategories = useMemo(() => {
    const raw = user?.preferences?.favoriteMealTypes;
    const list = Array.isArray(raw) ? raw : [];
    return list
      .map((c) => String(c || "").trim())
      .filter(Boolean)
      .filter((c, idx, arr) => arr.indexOf(c) === idx);
  }, [user]);

  const showSuggestions =
    Boolean(user) &&
    isCustomer &&
    favoriteCategories.length > 0;

  return (
    <div className="home page">
      <TopBar />

      <main className="home__main">
        <section className="home__hero">
          <div className="home__hero-text">
            {user ? <div className="home__welcome">{welcome}</div> : null}
            <h1>
              Il tuo fast food
              <span> più veloce</span>
            </h1>


            <p className="home__hero-subtitle">Ordina online e ritira quando è pronto.</p>

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

          <Link to={rightCard.to} className="home__restaurants-card" aria-label={rightCard.title}>
            <div className="home__restaurants-image">
              {rightCard.showImage && rightCard.imageUrl ? (
                <>
                  <img src={rightCard.imageUrl} alt={rightCard.title} loading="lazy" />
                  {rightCard.badge ? <div className="home__featured-badge">{rightCard.badge}</div> : null}
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
        </section>

        {showSuggestions ? (
          <section className="home__suggestions">
            <div className="home__sectionHead">
              <h2 className="home__sectionTitle">Suggerimenti per te:</h2>
              <p className="home__sectionSubtitle">Categorie basate sulle tue preferenze</p>
            </div>

            <div className="home__chips" aria-label="Preferences">
              {favoriteCategories.map((category) => (
                <Link
                  key={category}
                  className="home__chip"
                  to={`/meals?category=${encodeURIComponent(category)}`}
                  aria-label={`Vai ai piatti della categoria ${category}`}
                >
                  {category}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </main>

      {/* Footer bar: sempre in fondo + bordo full width */}
      <footer className="homeFooter" aria-label="Footer">
        <div className="homeFooter__inner">
          <div className="homeFooter__grid">
            <section className="homeFooter__features" aria-label="Features">
              <div className="home__footerCard">
                <div className="home__footerIcon">
                  <LuUtensilsCrossed aria-hidden />
                </div>
                <div className="home__footerTitle">Ampia scelta</div>
                <div className="home__footerText">
                  Il nostro catalogo di piatti è vastissimo, ogni ristorante è diverso.
                </div>
              </div>

              <div className="home__footerCard">
                <div className="home__footerIcon">
                  <LuClock aria-hidden />
                </div>
                <div className="home__footerTitle">Puntualità</div>
                <div className="home__footerText">
                  Il nostro sistema di ordinazioni è progettato per essere super efficiente.
                </div>
              </div>

              <div className="home__footerCard">
                <div className="home__footerIcon">
                  <LuMapPin aria-hidden />
                </div>
                <div className="home__footerTitle">Molti punti vendita</div>
                <div className="home__footerText">
                  Scegli tra tanti ristoranti diversi, sparsi in tutta Italia.
                </div>
              </div>

              <div className="home__footerCard">
                <div className="home__footerIcon">
                  <LuShieldCheck aria-hidden />
                </div>
                <div className="home__footerTitle">Pagamenti sicuri</div>
                <div className="home__footerText">Con noi i tuoi pagamenti sono rapidi e sicuri.</div>
              </div>
            </section>

            <aside className="homeFooter__contact" aria-label="Contatti">
              <div className="homeFooter__card homeFooter__card--contact">
                <h3 className="homeFooter__cardTitle">Contatti</h3>

                <ul className="homeFooter__list">
                  <li>
                    <span className="homeFooter__label">Email</span>
                    <a className="homeFooter__link" href="mailto:marco.galluccio1@studenti.unimi.com">
                      marco.galluccio1@studenti.unimi.com
                    </a>
                  </li>

                  <li>
                    <span className="homeFooter__label">Assistenza</span>
                    <span className="homeFooter__value">Lun–Ven 09:00–18:00</span>
                  </li>
                </ul>

                <div className="homeFooter__meta">
                  <span className="homeFooter__small">© {new Date().getFullYear()} FastFood</span>
                  <div className="homeFooter__links">
                    <a className="homeFooter__link" >
                      Privacy
                    </a>
                    <a className="homeFooter__link" >
                      Termini
                    </a>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </footer>
    </div>
  );
}
