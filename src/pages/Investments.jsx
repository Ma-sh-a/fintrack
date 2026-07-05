import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import GroupedPieChart from "../components/GroupedPieChart";
import AssetPnLChart from "../components/AssetPnLChart";
import RiskMeter from "../components/RiskMeter";
import {
  fetchMarketPrice,
  LIVE_PRICE_TYPES,
  riskLabel,
} from "../utils/marketData";
import {
  enrichAsset,
  portfolioTotals,
  calcRiskScore,
  groupSum,
} from "../utils/investmentCalc";

const ASSET_TYPES = [
  "Акции",
  "Облигации",
  "ETF/Фонды",
  "Криптовалюта",
  "Другое",
];

export default function Investments() {
  const { user } = useAuth();
  const [assets, setAssets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [ticker, setTicker] = useState("");
  const [type, setType] = useState(ASSET_TYPES[0]);
  const [broker, setBroker] = useState("");
  const [quantity, setQuantity] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [priceErrors, setPriceErrors] = useState({});

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "investments"),
      where("userId", "==", user.uid),
    );
    return onSnapshot(q, (snap) =>
      setAssets(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
  }, [user]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim() || !broker.trim() || !quantity || !purchasePrice) return;
    await addDoc(collection(db, "investments"), {
      userId: user.uid,
      name: name.trim(),
      ticker: ticker.trim().toUpperCase(),
      type,
      broker: broker.trim(),
      quantity: Number(quantity),
      purchasePrice: Number(purchasePrice),
      currentPrice: Number(purchasePrice),
      lastUpdated: null,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setName("");
    setTicker("");
    setBroker("");
    setQuantity("");
    setPurchasePrice("");
    setShowForm(false);
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, "investments", id));
  }

  async function handleRefreshPrice(asset) {
    setUpdatingId(asset.id);
    setPriceErrors((e) => ({ ...e, [asset.id]: null }));
    try {
      const price = await fetchMarketPrice(asset.ticker, asset.type);
      await updateDoc(doc(db, "investments", asset.id), {
        currentPrice: price,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      setPriceErrors((e) => ({ ...e, [asset.id]: err.message }));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleManualPrice(asset, value) {
    if (!value) return;
    await updateDoc(doc(db, "investments", asset.id), {
      currentPrice: Number(value),
      lastUpdated: new Date().toISOString(),
    });
  }

  const enriched = useMemo(() => assets.map(enrichAsset), [assets]);

  const { totalValue, totalCost, totalPnl, totalPnlPct } = useMemo(
    () => portfolioTotals(enriched),
    [enriched],
  );

  const byBroker = useMemo(
    () =>
      groupSum(
        enriched,
        (a) => a.broker,
        (a) => a.value,
      ),
    [enriched],
  );
  const byType = useMemo(
    () =>
      groupSum(
        enriched,
        (a) => a.type,
        (a) => a.value,
      ),
    [enriched],
  );
  const pnlChartData = useMemo(
    () =>
      enriched
        .filter((a) => a.cost > 0)
        .map((a) => ({ name: a.name, pnlPct: a.pnlPct })),
    [enriched],
  );

  const riskScore = useMemo(() => calcRiskScore(enriched), [enriched]);

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ marginBottom: 0 }}>Инвестиции</h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Закрыть" : "+ Добавить актив"}
        </button>
      </div>

      <div className="stat-cards" style={{ marginTop: 20 }}>
        <div className="stat-card">
          <span className="stat-label">Стоимость портфеля</span>
          <span className="stat-value">
            {totalValue.toLocaleString("ru-RU")} ₽
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Вложено</span>
          <span className="stat-value">
            {totalCost.toLocaleString("ru-RU")} ₽
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Доходность</span>
          <span
            className={`stat-value ${totalPnl >= 0 ? "positive" : "negative"}`}
          >
            {totalPnl >= 0 ? "+" : ""}
            {totalPnl.toLocaleString("ru-RU")} ₽ ({totalPnlPct >= 0 ? "+" : ""}
            {totalPnlPct.toFixed(1)}%)
          </span>
        </div>
      </div>

      {showForm && (
        <form className="transaction-form" onSubmit={handleAdd}>
          <input
            placeholder="Название актива"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Тикер"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
          />
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {ASSET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            placeholder="Брокер / банк"
            value={broker}
            onChange={(e) => setBroker(e.target.value)}
          />
          <input
            type="number"
            placeholder="Количество"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <input
            type="number"
            placeholder="Цена покупки за единицу, ₽"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
          />
          <button className="btn-primary" type="submit">
            Добавить
          </button>
        </form>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <h2>По брокерам / банкам</h2>
          <GroupedPieChart
            data={byBroker}
            emptyText="Добавь активы, чтобы увидеть распределение."
          />
        </div>
        <div className="card">
          <h2>По типам активов</h2>
          <GroupedPieChart
            data={byType}
            emptyText="Добавь активы, чтобы увидеть распределение."
          />
        </div>
      </div>

      <div className="card">
        <h2>Риск-профиль портфеля</h2>
        {riskScore === null ? (
          <p className="empty-state">
            Добавь активы, чтобы рассчитать риск-профиль.
          </p>
        ) : (
          <RiskMeter score={riskScore} label={riskLabel(riskScore)} />
        )}
      </div>

      <div className="card">
        <h2>Доходность по активам</h2>
        <AssetPnLChart data={pnlChartData} />
      </div>

      <h2 style={{ marginTop: 8 }}>Все активы</h2>
      <ul className="asset-list">
        {enriched.map((a) => (
          <li key={a.id} className="asset-item">
            <div className="asset-item-head">
              <div>
                <span className="asset-name">{a.name}</span>
                {a.ticker && <span className="asset-ticker">{a.ticker}</span>}
              </div>
              <button
                className="btn-link danger"
                onClick={() => handleDelete(a.id)}
              >
                Удалить
              </button>
            </div>
            <div className="asset-item-meta muted">
              {a.type} · {a.broker} · {a.quantity} шт.
            </div>
            <div className="asset-item-prices">
              <span>Покупка: {a.purchasePrice.toLocaleString("ru-RU")} ₽</span>
              <span>
                Текущая:{" "}
                <input
                  type="number"
                  className="price-inline-input"
                  defaultValue={a.currentPrice}
                  onBlur={(e) => handleManualPrice(a, e.target.value)}
                />{" "}
                ₽
              </span>
              {LIVE_PRICE_TYPES.includes(a.type) && (
                <button
                  className="btn-link"
                  disabled={updatingId === a.id}
                  onClick={() => handleRefreshPrice(a)}
                >
                  {updatingId === a.id ? "Обновляю…" : "↻ Обновить курс"}
                </button>
              )}
            </div>
            {priceErrors[a.id] && (
              <p className="auth-error">{priceErrors[a.id]}</p>
            )}
            <div className="asset-item-result">
              <span>Стоимость: {a.value.toLocaleString("ru-RU")} ₽</span>
              <span className={a.pnl >= 0 ? "positive" : "negative"}>
                {a.pnl >= 0 ? "+" : ""}
                {a.pnl.toLocaleString("ru-RU")} ₽ ({a.pnlPct >= 0 ? "+" : ""}
                {a.pnlPct.toFixed(1)}%)
              </span>
            </div>
          </li>
        ))}
        {enriched.length === 0 && (
          <p className="empty-state">Портфель пуст — добавьте первый актив.</p>
        )}
      </ul>
    </div>
  );
}
