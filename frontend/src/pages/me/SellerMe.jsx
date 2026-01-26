import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

export default function SellerMe() {
  const { user, logout } = useAuth();

  const initial = useMemo(
    () => ({
      name: user?.name || user?.fullName || "",
      email: user?.email || "",
    }),
    [user]
  );

  const [profile, setProfile] = useState(initial);
  const [pw, setPw] = useState({ currentPassword: "", newPassword: "" });

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [dangerOpen, setDangerOpen] = useState(false);

  function onChangeProfile(e) {
    setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  function onChangePw(e) {
    setPw((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      // TODO: PATCH /api/users/me
      setMsg("Dati aggiornati (stub).");
    } catch {
      setErr("Errore durante l'aggiornamento.");
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setMsg("");
    setErr("");

    if (!pw.currentPassword || !pw.newPassword) {
      setErr("Inserisci password attuale e nuova password.");
      return;
    }

    try {
      // TODO: PATCH /api/users/me/password
      setPw({ currentPassword: "", newPassword: "" });
      setMsg("Password aggiornata (stub).");
    } catch {
      setErr("Errore durante il cambio password.");
    }
  }

  async function handleDeleteAccount() {
    setMsg("");
    setErr("");

    try {
      // TODO: DELETE /api/users/me
      logout();
    } catch {
      setErr("Errore durante l'eliminazione account.");
    }
  }

  const restaurantName = user?.restaurantName || user?.restaurant?.name || "Il mio ristorante";

  return (
    <div className="card me__card">
      <h1 className="me__title">Profilo</h1>
      <p className="me__subtitle">Seller</p>

      {err && <div className="alert alert--error" style={{ marginTop: 12 }}>{err}</div>}
      {msg && <div className="alert" style={{ marginTop: 12 }}>{msg}</div>}

      <div className="me__grid">
        <div className="card me__panel card--flat">
          <h3 className="me__panelTitle">I tuoi dati</h3>

          <form className="me__form" onSubmit={handleSaveProfile}>
            <label className="me__label">
              Nome
              <input className="input" name="name" value={profile.name} onChange={onChangeProfile} />
            </label>

            <label className="me__label">
              Email
              <input className="input" name="email" value={profile.email} onChange={onChangeProfile} />
            </label>

            <button className="btn btn--primary" type="submit">
              Salva modifiche
            </button>
          </form>
        </div>

        <div className="card me__panel card--flat">
          <h3 className="me__panelTitle">Area ristorante</h3>
          <p className="me__text" style={{ marginTop: 0 }}>
            <strong>{restaurantName}</strong>
          </p>
          <p className="me__text">
            Gestisci menu, disponibilità, ordini e statistiche.
          </p>

          <div className="me__actionsRow">
            <Link to="/seller/restaurant" className="btn btn--secondary">
              Vai alla gestione
            </Link>
            <Link to="/restaurants" className="btn btn--ghost">
              Vedi pagina pubblica
            </Link>
          </div>
        </div>

        <div className="card me__panel card--flat">
          <h3 className="me__panelTitle">Sicurezza</h3>

          <form className="me__form" onSubmit={handleChangePassword}>
            <label className="me__label">
              Password attuale
              <input
                className="input"
                type="password"
                name="currentPassword"
                value={pw.currentPassword}
                onChange={onChangePw}
                autoComplete="current-password"
              />
            </label>

            <label className="me__label">
              Nuova password
              <input
                className="input"
                type="password"
                name="newPassword"
                value={pw.newPassword}
                onChange={onChangePw}
                autoComplete="new-password"
              />
            </label>

            <button className="btn btn--secondary" type="submit">
              Cambia password
            </button>
          </form>

          <div className="me__divider" />

          <div className="me__danger">
            <button className="btn btn--ghost" type="button" onClick={logout}>
              Logout
            </button>

            <button
              className="btn me__dangerBtn"
              type="button"
              onClick={() => setDangerOpen((v) => !v)}
            >
              Elimina account
            </button>

            {dangerOpen && (
              <div className="me__dangerBox">
                <p style={{ margin: 0, opacity: 0.9 }}>
                  Questa azione è irreversibile. Vuoi continuare?
                </p>
                <div className="me__dangerActions">
                  <button className="btn btn--secondary" type="button" onClick={() => setDangerOpen(false)}>
                    Annulla
                  </button>
                  <button className="btn me__dangerConfirm" type="button" onClick={handleDeleteAccount}>
                    Sì, elimina
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
