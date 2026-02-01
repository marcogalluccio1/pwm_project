import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LuArrowLeft, LuClock, LuPackage, LuStore, LuTruck, LuShoppingBag } from "react-icons/lu";

import TopBar from "../../components/TopBar";
import { useAuth } from "../../auth/useAuth";
import { getMyOrdersApi } from "../../api/orders.api";

import "./CustomerOrders.css";

function formatEUR(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return "€0.00";
  return `€${v.toFixed(2)}`;
}

function formatDateTime(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

function getOrderId(o) {
  return String(o?._id || o?.id || "");
}

function getRestaurantName(o) {
  return o?.restaurantId?.name || "Ristorante";
}

function getRestaurantAddress(o) {
  const city = o?.restaurantId?.city;
  const address = o?.restaurantId?.address;
  if (city && address) return `${city} • ${address}`;
  if (city) return city;
  if (address) return address;
  return "";
}

function getFulfillmentLabel(o) {
  const f = o?.fulfillment;
  if (f === "delivery") return "Consegna a domicilio";
  return "Asporto";
}

const steps = [
  { key: "ordered", label: "Ordinato" },
  { key: "preparing", label: "In preparazione" },
  { key: "delivering", label: "In consegna" },
  { key: "delivered", label: "Consegnato" },
];

function statusToStepIndex(status) {
  switch (status) {
    case "ordered":
      return 0;
    case "preparing":
      return 1;
    case "delivering":
      return 2;
    case "delivered":
      return 3;
    default:
      return 0;
  }
}

function isActiveOrder(o) {
  return o?.status !== "delivered";
}

function sumItems(items) {
  return (items || []).reduce((s, it) => s + (Number(it?.quantity) || 0), 0);
}

export default function CustomerOrders() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();

  const isLogged = !!user;
  const isCustomer = user?.role === "customer";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeOrders, setActiveOrders] = useState([]);
  const [pastOrders, setPastOrders] = useState([]);

  const activeSectionRef = useRef(null);
  const pastSectionRef = useRef(null);

  function scrollTo(ref) {
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const highlightId = location.state?.highlightId || null;

  useEffect(() => {
    if (isLoading) return;

    if (!isLogged) {
      navigate("/login", { state: { from: "/orders" }, replace: true });
      return;
    }

    if (!isCustomer) navigate(-1);
  }, [isLoading, isLogged, isCustomer, navigate]);

  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setError("");

        const [a, p] = await Promise.all([getMyOrdersApi({ type: "active" }), getMyOrdersApi({ type: "past" })]);

        const active = a?.orders || a || [];
        const past = p?.orders || p || [];

        if (!alive) return;
        setActiveOrders(Array.isArray(active) ? active : []);
        setPastOrders(Array.isArray(past) ? past : []);
      } catch {
        if (!alive) return;
        setError("Impossibile caricare gli ordini.");
        setActiveOrders([]);
        setPastOrders([]);
      } finally {
        setLoading(false);
      }
    }

    run();
    return () => {
      alive = false;
    };
  }, []);

  const activeSorted = useMemo(() => {
    const arr = (activeOrders || []).filter((o) => o?.status !== "delivered");
    arr.sort((x, y) => new Date(y?.createdAt || 0).getTime() - new Date(x?.createdAt || 0).getTime());
    return arr;
  }, [activeOrders]);

  const pastSorted = useMemo(() => {
    const arr = (pastOrders || []).filter((o) => o?.status === "delivered");
    arr.sort((x, y) => new Date(y?.updatedAt || 0).getTime() - new Date(x?.updatedAt || 0).getTime());
    return arr;
  }, [pastOrders]);

  if (isLoading) {
    return (
      <div className="ordersPage">
        <TopBar />
        <div className="ordersWrap">
          <div className="checkoutCard">
            <div className="checkoutEmpty">Caricamento...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ordersPage">
      <TopBar />

      <div className="ordersWrap">
        <div className="ordersHeader">
          <button
            className="btn btn--ghost page__back"
            type="button"
            onClick={() =>
              navigate(-1)
            }
          >
            <LuArrowLeft aria-hidden />
            Indietro
          </button>

          <div className="ordersTitleBlock">
            <h1 className="ordersTitle">I miei ordini</h1>
            <p className="ordersSubtitle">Controlla ordini in corso e passati.</p>
          </div>
        </div>

        {error ? <div className="alert alert--error">{error}</div> : null}

        <div className="ordersGrid">
          <div className="checkoutCard ordersLeft">
            <div className="ordersSectionHead" ref={activeSectionRef}>
              <div className="ordersSectionTitle">Ordini in corso</div>
              <div className="ordersSectionHint">
                Tracking stato: Ordinato → In preparazione → In consegna → Consegnato
              </div>
            </div>


            {loading ? (
              <div className="checkoutEmpty">Caricamento...</div>
            ) : activeSorted.length === 0 ? (
              <div className="checkoutEmpty">Nessun ordine in corso.</div>
            ) : (
              <div className="ordersList">
                {activeSorted.map((o) => (
                  <OrderRow key={getOrderId(o)} order={o} kind="active" highlight={highlightId} />
                ))}
              </div>
            )}

            <div className="ordersDivider" />

            <div className="ordersSectionHead" ref={pastSectionRef}>
              <div className="ordersSectionTitle">Ordini passati</div>
              <div className="ordersSectionHint">Cronologia completa dei tuoi acquisti.</div>
            </div>

            {loading ? (
              <div className="checkoutEmpty">Caricamento...</div>
            ) : pastSorted.length === 0 ? (
              <div className="checkoutEmpty">Nessun ordine passato.</div>
            ) : (
              <div className="ordersList">
                {pastSorted.map((o) => (
                  <OrderRow key={getOrderId(o)} order={o} kind="past" highlight={highlightId} />
                ))}
              </div>
            )}
          </div>

          <div className="checkoutCard ordersRight">
            <div className="checkoutCardTop">
              <h2 className="checkoutCardTitle">Riepilogo ordini:</h2>
            </div>

            <button
              type="button"
              className="btn btn--ghost ordersStat ordersStat--link"
              onClick={() => scrollTo(activeSectionRef)}
            >
              <span>In corso</span>
              <strong>{activeSorted.length}</strong>
            </button>

            <button
              type="button"
              className="btn btn--ghost ordersStat ordersStat--link"
              onClick={() => scrollTo(pastSectionRef)}
            >
              <span>Passati</span>
              <strong>{pastSorted.length}</strong>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

function OrderRow({ order, kind, highlight }) {
  const id = getOrderId(order);
  const step = statusToStepIndex(order?.status);
  const items = Array.isArray(order?.items) ? order.items : [];
  const itemCount = sumItems(items);

  const isHighlighted = highlight && String(highlight) === String(id);

  const restaurantName = getRestaurantName(order);
  const restaurantInfo = getRestaurantAddress(order);

  const isActive = kind === "active" && isActiveOrder(order);

  return (
    <div className={`orderRow card ${isHighlighted ? "orderRow--highlight" : ""}`}>
      <div className="orderRowTop">
        <div className="orderRowMain">
          <div className="orderRowTitle">
            <LuStore aria-hidden />
            <span className="orderRowTitleText">{restaurantName}</span>
          </div>
          {restaurantInfo ? <div className="orderRowSub">{restaurantInfo}</div> : null}
        </div>

        <div className="orderRowRight">
          <div className="orderMeta">
            <LuPackage aria-hidden />
            <span>{itemCount} articoli</span>
          </div>

          <div className="orderTotal">{formatEUR(order?.total)}</div>
        </div>
      </div>

      <div className="orderInfoRow">
        <div className="orderField">
          <div className="orderFieldLabel">Modalità</div>
          <div className="orderFieldValue">{getFulfillmentLabel(order)}</div>
        </div>

        {isActive ? (
          <div className="orderField">
            <div className="orderFieldLabel">Orario previsto</div>
            <div className="orderFieldValue">{formatDateTime(order?.estimatedReadyAt)}</div>
          </div>
        ) : (
          <div className="orderField">
            <div className="orderFieldLabel">Data ordine</div>
            <div className="orderFieldValue">{formatDateTime(order?.updatedAt)}</div>
          </div>
        )}

        <div className="orderCartCell">
          <span className="cartHoverIcon" aria-label="Mostra carrello" title="Mostra carrello">
            <LuShoppingBag aria-hidden />

            <span className="cartHoverIcon__panel" role="tooltip">
              <div className="cartHoverIcon__title">Piatti</div>

              {items.length === 0 ? (
                <div className="cartHoverIcon__empty">Nessun elemento.</div>
              ) : (
                <div className="cartHoverIcon__list">
                  {items.map((it, idx) => (
                    <div key={`${it?.mealId || idx}`} className="cartHoverIcon__item">
                      <div className="cartHoverIcon__left">
                        <span className="cartHoverIcon__qty">{Number(it?.quantity) || 0}x</span>
                        <span className="cartHoverIcon__name">{it?.nameSnapshot || "Piatto"}</span>
                    </div>
                        <span className="cartHoverIcon__price">{formatEUR(Number(it?.priceSnapshot) || 0)}</span>
                </div>
                  ))}
                </div>
              )}
            </span>
          </span>
        </div>
      </div>

      {isActive ? (
        <div className="orderTrackOuter">
          <div className="orderTrack">
            <div className="orderTrackBar">
              <div className="orderTrackFill" style={{ width: `${(step / (steps.length - 1)) * 100}%` }} />

              <div className="orderTrackSteps">
                {steps.map((s, i) => (
                  <div
                    key={s.key}
                    className={`orderTrackStep ${i <= step ? "isDone" : ""} ${
                      i === 0 ? "isFirst" : i === steps.length - 1 ? "isLast" : ""
                    }`}
                    style={{ left: `${(i / (steps.length - 1)) * 100}%` }}
                  >
                    <div className="orderTrackDot" />
                    <div className="orderTrackLabel">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
