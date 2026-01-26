import { Link } from "react-router-dom";
import TopBar from "../../components/TopBar";
import "./Home.css";

export default function Home() {
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

          <div className="home__cta">
            <Link to="/login" className="btn btn--primary btn--lg">Accedi</Link>
            <Link to="/register" className="btn btn--secondary btn--lg">Crea account</Link>
          </div>
        </div>

        <Link to="/restaurants" className="home__restaurants-card">
          <div className="home__restaurants-image" />
          <h3 className="home__restaurants-title">Ristoranti</h3>
          <p className="home__restaurants-text">
            Scopri tutti i ristoranti disponibili e i loro menù.
          </p>
          <div className="home__restaurants-cta">
            <span></span>
            <span aria-hidden>Vai ai ristoranti →</span>
          </div>
        </Link>
      </main>
    </div>
  );
}
