import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LuArrowLeft, LuPackage, LuUser } from "react-icons/lu";

import TopBar from "../../components/TopBar";
import { useAuth } from "../../auth/useAuth";
import { getRestaurantOrdersApi, updateOrderStatusApi } from "../../api/orders.api";

import "./RestaurantOrders.css";

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

function sumItems(items) {
  return (items || []).reduce((s, it) => s + (Number(it?.quantity) || 0), 0);
}

function getCustomerName(o) {
  const firstName = o?.customerId?.firstName || o?.customer?.firstName || "";
  const lastName = o?.customerId?.lastName || o?.customer?.lastName || "";
  const full = `${firstName} ${lastName}`.trim();
  return full || o?.customerId?.email || o?.customer?.email || "Cliente";
}

function getPaymentLabel(o) {
  const method = o?.payment?.method || o?.paymentMethod || "";
  if (!method) return "-";

  switch (method) {
    case "card":
      return "Carta";
    case "cash":
      return "Contanti";
    case "prepaid":
      return "Carta prepagata";
    default:
      return String(method);
  }
}

function getFulfillmentLabel(o) {
  const fulfillment = o?.fulfillment || "";
  if (!fulfillment) return "-";

  switch (fulfillment) {
    case "pickup":
      return "Da asporto";
    case "delivery":
      return "A domicilio";
    default:
      return String(fulfillment);
  }
}

function sortByDateAsc(a, b, field) {
  const ta = new Date(a?.[field] || 0).getTime();
  const tb = new Date(b?.[field] || 0).getTime();
  return ta - tb;
}

function sortByDateDesc(a, b, field) {
  const ta = new Date(a?.[field] || 0).getTime();
  const tb = new Date(b?.[field] || 0).getTime();
  return tb - ta;
}

export default function RestaurantOrders() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const isLogged = !!user;
  const isSeller = user?.role === "seller";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);

  const sectionOrderedRef = useRef(null);
  const sectionPreparingRef = useRef(null);
  const sectionDeliveringRef = useRef(null);
  const sectionDeliveredRef = useRef(null);

  function scrollTo(ref) {
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function loadOrders() {
    try {
      setLoading(true);
      setError("");
      const res = await getRestaurantOrdersApi();
      const list = res?.orders || res || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch {
      setOrders([]);
      setError("Impossibile caricare gli ordini.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isLoading) return;

    if (!isLogged) {
      navigate("/login", { state: { from: "/seller/orders" }, replace: true });
      return;
    }
    if (!isSeller) navigate(-1);
  }, [isLoading, isLogged, isSeller, navigate]);

  useEffect(() => {
    if (isLoading) return;
    if (!isLogged || !isSeller) return;
    loadOrders();
  }, [isLoading, isLogged, isSeller]);

  const grouped = useMemo(() => {
    const base = Array.isArray(orders) ? [...orders] : [];
    const ordered = base.filter((o) => o?.status === "ordered");
    const preparing = base.filter((o) => o?.status === "preparing");
    const delivering = base.filter((o) => o?.status === "delivering");
    const delivered = base.filter((o) => o?.status === "delivered");

    ordered.sort((a, b) => sortByDateAsc(a, b, "estimatedReadyAt") || sortByDateAsc(a, b, "createdAt"));
    preparing.sort((a, b) => sortByDateAsc(a, b, "estimatedReadyAt") || sortByDateAsc(a, b, "createdAt"));
    delivering.sort((a, b) => sortByDateDesc(a, b, "createdAt"));
    delivered.sort((a, b) => sortByDateDesc(a, b, "updatedAt"));

    return { ordered, preparing, delivering, delivered };
  }, [orders]);

  async function goNextStatus(order) {
    const id = getOrderId(order);
    if (!id || updatingId) return;

    let nextStatus = null;
    if (order?.status === "ordered") nextStatus = "preparing";
    if (order?.status === "preparing" && order?.fulfillment === "pickup") nextStatus = "delivered";
    if (order?.status === "preparing" && order?.fulfillment === "delivery") nextStatus = "delivering";
    if (!nextStatus) return;

    try {
      setUpdatingId(id);
      const updated = await updateOrderStatusApi(id, { status: nextStatus });
      const updatedOrder = updated?.order || updated;

      if (updatedOrder && getOrderId(updatedOrder)) {
        setOrders((prev) => {
          const arr = Array.isArray(prev) ? prev : [];
          const idx = arr.findIndex((x) => getOrderId(x) === id);
          if (idx === -1) return arr;
          const copy = [...arr];
          copy[idx] = { ...copy[idx], ...updatedOrder };
          return copy;
        });
      } else {
        setOrders((prev) =>
          Array.isArray(prev) ? prev.map((x) => (getOrderId(x) === id ? { ...x, status: nextStatus } : x)) : []
        );
      }
    } catch {
      setError("Impossibile aggiornare lo stato dell'ordine.");
    } finally {
      setUpdatingId(null);
    }
  }

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
    <div className="ordersPage restaurantOrders">
      <TopBar />

      <div className="ordersWrap">
        <div className="ordersHeader">
          <button className="btn btn--ghost page__back" type="button" onClick={() => navigate(-1)}>
            <LuArrowLeft aria-hidden />
            Indietro
          </button>

          <div className="ordersTitleBlock">
            <h1 className="ordersTitle">Ordini ristorante</h1>
            <p className="ordersSubtitle">Gestisci i tuoi ordini e aggiorna lo stato.</p>
          </div>
        </div>

        {error ? <div className="alert alert--error">{error}</div> : null}

        <div className="ordersGrid">
          <div className="checkoutCard ordersLeft">
            <OrdersSection
              title="Ordini in carico"
              hint="Coda degli ordini presi in carico"
              innerRef={sectionOrderedRef}
              loading={loading}
              orders={grouped.ordered}
              emptyText="Nessun ordine in carico."
              onNext={goNextStatus}
              updatingId={updatingId}
              showNext
            />

            <div className="ordersDivider" />

            <OrdersSection
              title="Ordini in preparazione"
              hint="Coda degli ordini in preparazione"
              innerRef={sectionPreparingRef}
              loading={loading}
              orders={grouped.preparing}
              emptyText="Nessun ordine in preparazione."
              onNext={goNextStatus}
              updatingId={updatingId}
              showNext
            />

            <div className="ordersDivider" />

            <OrdersSection
              title="Ordini in consegna"
              hint="Coda degli ordini in consegna"
              innerRef={sectionDeliveringRef}
              loading={loading}
              orders={grouped.delivering}
              emptyText="Nessun ordine in consegna."
              onNext={goNextStatus}
              updatingId={updatingId}
            />

            <div className="ordersDivider" />

            <OrdersSection
              title="Ordini consegnati"
              hint="Storico ordini completati"
              innerRef={sectionDeliveredRef}
              loading={loading}
              orders={grouped.delivered}
              emptyText="Nessun ordine consegnato."
              onNext={goNextStatus}
              updatingId={updatingId}
            />
          </div>

          <div className="checkoutCard ordersRight">
            <div className="checkoutCardTop">
              <h2 className="checkoutCardTitle">Riepilogo ordini:</h2>
            </div>

            <button type="button" className="btn btn--ghost ordersStat ordersStat--link" onClick={() => scrollTo(sectionOrderedRef)}>
              <span>In carico</span>
              <strong>{grouped.ordered.length}</strong>
            </button>

            <button
              type="button"
              className="btn btn--ghost ordersStat ordersStat--link"
              onClick={() => scrollTo(sectionPreparingRef)}
            >
              <span>In preparazione</span>
              <strong>{grouped.preparing.length}</strong>
            </button>

            <button
              type="button"
              className="btn btn--ghost ordersStat ordersStat--link"
              onClick={() => scrollTo(sectionDeliveringRef)}
            >
              <span>In consegna</span>
              <strong>{grouped.delivering.length}</strong>
            </button>

            <button
              type="button"
              className="btn btn--ghost ordersStat ordersStat--link"
              onClick={() => scrollTo(sectionDeliveredRef)}
            >
              <span>Consegnati</span>
              <strong>{grouped.delivered.length}</strong>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrdersSection({ title, hint, loading, orders, emptyText, innerRef, showNext, onNext, updatingId }) {
  return (
    <div className="ordersSection" ref={innerRef}>
      <div className="ordersSectionHead">
        <div className="ordersSectionTitle">{title}</div>
        <div className="ordersSectionHint">{hint}</div>
      </div>

      {loading ? (
        <div className="checkoutEmpty">Caricamento...</div>
      ) : (orders || []).length === 0 ? (
        <div className="checkoutEmpty">{emptyText}</div>
      ) : (
        <div className="ordersList">
          {(orders || []).map((o) => (
            <OrderRow
              key={getOrderId(o)}
              order={o}
              showNext={showNext}
              onNext={onNext}
              isUpdating={updatingId && String(updatingId) === String(getOrderId(o))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({ order, showNext, onNext, isUpdating }) {
  const id = getOrderId(order);
  const items = Array.isArray(order?.items) ? order.items : [];
  const itemCount = sumItems(items);

  const mealsSorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => (Number(b?.quantity) || 0) - (Number(a?.quantity) || 0));
    return arr;
  }, [items]);

  const nextLabel =
    order?.status === "ordered"
      ? "Passa a In preparazione"
      : order?.status === "preparing"
        ? "Passa a In consegna"
        : null;

  return (
    <div className="orderRow card">
      <div className="orderRowTop">
        <div className="orderRowMain">
          <div className="orderRowTitle">
            <LuUser aria-hidden />
            <span className="orderRowTitleText">{getCustomerName(order)}</span>
          </div>
          <div className="orderRowSub">Data ordinazione: {formatDateTime(order?.createdAt)}</div>
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
          <div className="orderFieldLabel">Modalità di consegna: </div>
          <div className="orderFieldValue">{getFulfillmentLabel(order)}</div>
        </div>

        <div className="orderField">
          <div className="orderFieldLabel">Orario previsto: </div>
          <div className="orderFieldValue">{formatDateTime(order?.estimatedReadyAt)}</div>
        </div>

        <div className="orderField">
          <div className="orderFieldLabel">Metodo di pagamento:</div>
          <div className="orderFieldValue">{getPaymentLabel(order)}</div>
        </div>

      </div>

      <div className="orderMeals">
        <div className="orderMealsTitle">Piatti:</div>
        <div className="ordersDivider" />
        {mealsSorted.length === 0 ? (
          <div className="orderMealsEmpty">Nessun elemento.</div>
        ) : (
          
          <div className="orderMealsList">
            {mealsSorted.map((it, idx) => (
              <div key={`${it?.mealId || idx}`} className="orderMealRow">
                <div className="orderMealLeft">
                  <span className="orderMealQty">{Number(it?.quantity) || 0}x</span>
                  <span className="orderMealName">{it?.nameSnapshot || "Piatto"}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNext && nextLabel ? (
        <div className="orderActions">
          <button type="button" className="btn btn--primary" onClick={() => onNext(order)} disabled={isUpdating}>
            {isUpdating ? "Aggiornamento..." : nextLabel}
          </button>
        </div>
      ) : null}

      <div className="orderId">ID ordine: {id}</div>
    </div>
  );
}
