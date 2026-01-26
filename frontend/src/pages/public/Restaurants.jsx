import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listRestaurantsApi } from "../../api/restaurants.api";
import "./Restaurants.css";

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [city, setCity] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    setLoading(true);
    try {
      const data = await listRestaurantsApi({
        city: city.trim() || undefined,
        name: name.trim() || undefined,
      });

      const list = data.restaurants ?? data;
      setRestaurants(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err?.response?.data?.message || "Errore nel caricamento dei ristoranti.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    load();
  }

  return (
    <div className="restaurants">
      <div className="restaurants__header">
        <h1>Ristoranti</h1>
        <Link to="/" className="btn btn--ghost">Home</Link>
      </div>

      <form className="restaurants__filters" onSubmit={handleSubmit}>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Cerca per nome."
        />
        <input
          className="input"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Cerca per città."
        />
        <button className="btn btn--primary" type="submit">
          Cerca
        </button>
      </form>

      {error && <div className="alert alert--error restaurants__error">{error}</div>}


      {loading && <div>Caricamento...</div>}
      {error && <div className="restaurants__error">{error}</div>}

      {!loading && !error && restaurants.length === 0 && (
        <div>Nessun ristorante trovato.</div>
      )}

      <div className="restaurants__grid">
        {restaurants.map((r) => (
          <Link key={r._id} to={`/restaurants/${r._id}`} className="restaurants__card">
            <div className="restaurants__card-title">{r.name}</div>
            <div className="restaurants__card-meta">
              {r.city ? r.city : "Città non disponibile"}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
