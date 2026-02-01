import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LuArrowLeft, LuMinus, LuPlus, LuShoppingBag } from "react-icons/lu";

import TopBar from "../../components/TopBar";
import { useAuth } from "../../auth/useAuth";

import { getRestaurantByIdApi, getRestaurantMenuApi } from "../../api/restaurants.api";
import { createOrderApi } from "../../api/orders.api";

import "./Checkout.css";

function formatEUR(value) {
  const v = Number(value);
  if (!Number.isFinite(v)) return "€0.00";
  return `€${v.toFixed(2)}`;
}

function getMealId(m) {
  return String(m?._id || m?.id || "");
}

function getMealName(m) {
  return m?.nameIt || m?.name || "Unnamed";
}

function getMealPriceNumber(m) {
  const raw =
    typeof m?.price === "number"
      ? m.price
      : typeof m?.price === "string"
      ? Number(m.price)
      : typeof m?.priceCents === "number"
      ? m.priceCents / 100
      : 0;

  return Number.isFinite(raw) ? raw : 0;
}

function hasPaymentMethod(user) {
  const pm =
    user?.paymentMethod ??
    user?.payment_method ??
    user?.payment ??
    user?.billing?.paymentMethod ??
    user?.billing?.payment_method;

  if (!pm) return false;

  if (typeof pm === "string") return pm.trim().length > 0;
  if (typeof pm === "object") {
    const type = pm.type || pm.method || pm.kind;
    if (typeof type === "string" && type.trim().length > 0) return true;
  }
  return false;
}

function inferPaymentMethod(user) {
  const pm =
    user?.paymentMethod ??
    user?.payment_method ??
    user?.payment ??
    user?.billing?.paymentMethod ??
    user?.billing?.payment_method;

  if (!pm) return "card";
  if (typeof pm === "string") return pm;
  if (typeof pm === "object") return pm.type || pm.method || pm.kind || "card";
  return "card";
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const isLogged = !!user;
  const isCustomer = user?.role === "customer";
  const hasPayMethod = hasPaymentMethod(user);


  const restaurantId = useMemo(() => {
    return location.state?.restaurantId || "";
  }, [location.state]);

  const initialCart = useMemo(() => {
    return location.state?.cart || {};
  }, [location.state]);

  const [cart, setCart] = useState(() => initialCart);
  useEffect(() => {
    setCart(initialCart);
  }, [initialCart]);

  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [fulfillment, setFulfillment] = useState("pickup");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoading) return;

    if (!isLogged) {
      navigate("/login", { state: { from: "/checkout" }, replace: true });
      return;
    }

    if (user.role !== "customer") {
      navigate(-1);
      return;
    }

    if (!restaurantId || !initialCart || Object.keys(initialCart).length === 0) {
      navigate(-1);
      return;
    }
  }, [isLoading, isLogged, user, navigate, restaurantId, initialCart]);


  useEffect(() => {
    let alive = true;

    async function run() {
      try {
        setLoading(true);
        setError("");

        const [r, m] = await Promise.all([getRestaurantByIdApi(restaurantId), getRestaurantMenuApi(restaurantId)]);
        if (!alive) return;

        setRestaurant(r);
        const rawMenu = Array.isArray(m?.menu) ? m.menu : [];
        const mealsList = rawMenu
          .map((it) => {
            const meal = it?.meal;
            if (!meal) return null;
            return { ...meal, price: it?.price };
          })
          .filter(Boolean);

        setMenu(mealsList);

      } catch {
        if (!alive) return;
        setError("Unable to load checkout data.");
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    if (restaurantId) run();
    return () => {
      alive = false;
    };
  }, [restaurantId]);

  const byId = useMemo(() => {
    const map = new Map();
    for (const meal of menu) map.set(getMealId(meal), meal);
    return map;
  }, [menu]);

  const cartRows = useMemo(() => {
    const rows = [];
    for (const [mealId, qtyRaw] of Object.entries(cart || {})) {
      const qty = Number(qtyRaw) || 0;
      if (qty <= 0) continue;

      const meal = byId.get(mealId);
      if (!meal) continue;

      const unit = getMealPriceNumber(meal);
      rows.push({
        mealId,
        name: getMealName(meal),
        unitPrice: unit,
        qty,
        lineTotal: unit * qty,
      });
    }
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }, [cart, byId]);
  
  const subtotal = useMemo(() => cartRows.reduce((sum, r) => sum + r.lineTotal, 0), [cartRows]);
  const deliveryFee = useMemo(() => (fulfillment === "delivery" ? 0 : 0), [fulfillment]);
  const total = useMemo(() => subtotal + deliveryFee, [subtotal, deliveryFee]);

  const canSubmit = !loading && !posting && cartRows.length > 0 && isCustomer && hasPayMethod;


  function getMealThumb(m) {
    return m?.thumbnailUrl || m?.strMealThumb || "";
  }

  function onSelectFulfillment(value) {
    if (value === "delivery") return;
    setFulfillment(value);
  }

  async function onCreateOrder() {
    if (!canSubmit) return;

    try {
      setPosting(true);
      setError("");

      const items = cartRows.map((r) => ({
        mealId: r.mealId,
        nameSnapshot: r.name,
        priceSnapshot: r.unitPrice,
        quantity: r.qty,
      }));

      const payload = {
        restaurantId,
        items,
        fulfillment,
        deliveryAddress: fulfillment === "delivery" ? "TBD" : "",
        distanceKm: fulfillment === "delivery" ? 0 : 0,
        subtotal,
        deliveryFee,
        total,
        paymentMethod: inferPaymentMethod(user),
      };

      const created = await createOrderApi(payload);

      const orderId = created?.order?._id || created?.order?.id || created?._id || created?.id;
      navigate("/customer/orders", { state: { highlightId: orderId || null } });
    } catch {
      setError("Order creation failed. Please try again.");
    } finally {
      setPosting(false);
    }
  }
  if (isLoading) {
    return (
      <div className="checkoutPage">
        <TopBar />
        <div className="checkoutWrap">
          <div className="checkoutCard">
            <div className="checkoutEmpty">Caricamento...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkoutPage">
      <TopBar />

      <div className="checkoutWrap">
        <div className="checkoutHeader">
          <button
            className="btn btn--ghost page__back"
            type="button"
            onClick={() =>
              navigate(`/restaurants/${restaurantId}`, {
                state: { cart },
              })
            }
          >
            <LuArrowLeft aria-hidden />
            Indietro
          </button>

          <div className="checkoutTitleBlock">
            <h1 className="checkoutTitle">Checkout</h1>
            <p className="checkoutSubtitle">
              {restaurant?.name || "Restaurant"} • Rivedi il tuo ordine
            </p>
          </div>
        </div>

        <div className="checkoutGrid checkoutGrid--twoCols">
          <div className="checkoutCard checkoutLeft">
            <div className="checkoutSection">
              <div className="checkoutCardTop">
                <h2 className="checkoutCardTitle">Modalità di consegna</h2>
                <p className="checkoutCardHint">Il delivery non è al momento disponibile</p>
              </div>

              <div className="checkoutRadioRow checkoutRadioRow--spaced">
                <button
                  type="button"
                  className={`checkoutRadio ${fulfillment === "pickup" ? "isActive" : ""}`}
                  onClick={() => onSelectFulfillment("pickup")}
                >
                  Asporto
                </button>

                <button type="button" className="checkoutRadio isDisabled" title="Attualmente non disponibile">
                  Consegna a domicilio
                </button>
              </div>
            </div>

            <div className="checkoutDivider" />

            <div className="checkoutSection">
              <div className="checkoutCardTop">
                <h2 className="checkoutCardTitle">Carrello</h2>
                <div className="checkoutBadge">
                  <LuShoppingBag />
                  <span>{cartRows.reduce((s, r) => s + r.qty, 0)}</span>
                </div>
              </div>

              {loading ? (
                <div className="checkoutEmpty">Caricamento...</div>
              ) : cartRows.length === 0 ? (
                <div className="checkoutEmpty">Il tuo carrello è vuoto.</div>
              ) : (
                <div className="checkoutList">
                  {cartRows.map((r) => {
                    const meal = byId.get(String(r.mealId));
                    const thumb = meal ? getMealThumb(meal) : "";

                    return (
                      <div key={r.mealId} className="checkoutRow">
                        <div className="checkoutRowLeft">
                          <div className="checkoutRowThumb">
                            {thumb ? <img src={thumb} alt={r.name} loading="lazy" /> : <div className="checkoutRowThumbPh" />}
                          </div>

                          <div className="checkoutRowMain">
                            <div className="checkoutRowName">{r.name}</div>
                            <div className="checkoutRowMeta">
                              <span>{formatEUR(r.unitPrice)}</span>
                              <span className="dot">•</span>
                              <span>Tot: {formatEUR(r.lineTotal)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="checkoutQtyReadOnly" title="Modifica quantità dal ristorante">
                          x{r.qty}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="checkoutCard checkoutSummary checkoutRight">
            <div className="checkoutCardTop">
              <h2 className="checkoutCardTitle">Pagamento</h2>
            </div>

            <div className="summaryLine">
              <span>Subtotale</span>
              <span>{formatEUR(subtotal)}</span>
            </div>
            <div className="summaryLine">
              <span>Consegna</span>
              <span>{formatEUR(deliveryFee)}</span>
            </div>
            <div className="summaryDivider" />
            <div className="summaryLine isTotal">
              <span>Totale (IVA inclusa)</span>
              <span>{formatEUR(total)}</span>
            </div>

            {error ? <div className="checkoutError">{error}</div> : null}

            <button className="checkoutCta" type="button" disabled={!canSubmit} onClick={onCreateOrder}>
              {posting ? "Pagamento in corso..." : "Procedi al pagamento"}
            </button>
            {!hasPayMethod ? (
              <button
                type="button"
                className="checkoutCta checkoutCta--secondary"
                onClick={() => {
                  sessionStorage.setItem("checkoutCart", JSON.stringify({ restaurantId, cart }));
                  navigate("/me", { state: { from: "/checkout" } });
                }}
              >
                Imposta metodo di pagamento
              </button>
            ) : null}


            <div className="checkoutNote">
              Metodo di pagamento: <strong>{inferPaymentMethod(user)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
