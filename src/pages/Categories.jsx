import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import ErrorBanner from "../components/ErrorBanner";

const COLORS = [
  "#832D51",
  "#EA6993",
  "#447A5F",
  "#F6C94D",
  "#CFDD9D",
  "#F8CAE4",
];

export default function Categories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [type, setType] = useState("expense");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    setError(null);
    const q = query(
      collection(db, "categories"),
      where("userId", "==", user.uid),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (err) => {
        console.error("Ошибка загрузки категорий:", err);
        setError(
          "Не удалось загрузить категории. Проверь соединение с интернетом.",
        );
        setLoading(false);
      },
    );
    const qTx = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
    );
    const unsubTx = onSnapshot(
      qTx,
      (snap) =>
        setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error("Ошибка загрузки транзакций:", err),
    );
    return () => {
      unsub();
      unsubTx();
    };
  }, [user]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await addDoc(collection(db, "categories"), {
      userId: user.uid,
      name: name.trim(),
      type,
      monthlyLimit: type === "expense" ? Number(limit) || 0 : 0,
      color: COLORS[categories.length % COLORS.length],
    });
    setName("");
    setLimit("");
  }

  async function handleDelete(id) {
    await deleteDoc(doc(db, "categories", id));
  }

  const expenseCats = categories.filter(
    (c) => (c.type || "expense") === "expense",
  );
  const incomeCats = categories.filter((c) => c.type === "income");

  return (
    <div className="page">
      <h1>Категории</h1>
      <ErrorBanner message={error} />
      {loading ? (
        <p className="empty-state">Загрузка категорий...</p>
      ) : (
        <>
          <form className="inline-form" onSubmit={handleAdd}>
            <div className="type-toggle" style={{ maxWidth: 200 }}>
              <button
                type="button"
                className={type === "expense" ? "active" : ""}
                onClick={() => setType("expense")}
              >
                Расход
              </button>
              <button
                type="button"
                className={type === "income" ? "active" : ""}
                onClick={() => setType("income")}
              >
                Доход
              </button>
            </div>
            <input
              placeholder="Название категории"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {type === "expense" && (
              <input
                type="number"
                placeholder="Лимит в месяц, ₽ (необязательно)"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
              />
            )}
            <button className="btn-primary" type="submit">
              Добавить
            </button>
          </form>

          <h2>Категории расходов</h2>
          <ul className="category-list">
            {expenseCats.map((c) => (
              <li key={c.id} className="category-item">
                <span
                  className="category-dot"
                  style={{ background: c.color }}
                />
                <span className="category-name">{c.name}</span>
                {c.monthlyLimit > 0 && (
                  <span className="category-limit">
                    лимит {c.monthlyLimit.toLocaleString("ru-RU")} ₽/мес
                  </span>
                )}
                <button
                  className="btn-link danger"
                  onClick={() => handleDelete(c.id)}
                >
                  Удалить
                </button>
              </li>
            ))}
            {expenseCats.length === 0 && (
              <p className="empty-state">Категорий расходов пока нет.</p>
            )}
          </ul>

          <h2 style={{ marginTop: 28 }}>Категории доходов</h2>
          <ul className="category-list">
            {incomeCats.map((c) => (
              <li key={c.id} className="category-item">
                <span
                  className="category-dot"
                  style={{ background: c.color }}
                />
                <span className="category-name">{c.name}</span>
                <button
                  className="btn-link danger"
                  onClick={() => handleDelete(c.id)}
                >
                  Удалить
                </button>
              </li>
            ))}
            {incomeCats.length === 0 && (
              <p className="empty-state">Категорий доходов пока нет.</p>
            )}
          </ul>

          <h2 style={{ marginTop: 28 }}>Лимиты бюджета на этот месяц</h2>
          {expenseCats.filter((c) => c.monthlyLimit > 0).length === 0 && (
            <p className="empty-state">
              Задай лимит категории выше, чтобы следить за бюджетом.
            </p>
          )}
          {expenseCats
            .filter((c) => c.monthlyLimit > 0)
            .map((c) => {
              const currentMonth = new Date().toISOString().slice(0, 7);
              const spent = transactions
                .filter(
                  (t) =>
                    t.type === "expense" &&
                    t.categoryId === c.id &&
                    t.date?.startsWith(currentMonth),
                )
                .reduce((s, t) => s + Number(t.amount), 0);
              const pct = Math.min(
                100,
                Math.round((spent / c.monthlyLimit) * 100),
              );
              return (
                <div key={c.id} className="budget-row">
                  <div className="budget-label">
                    <span>{c.name}</span>
                    <span>
                      {spent.toLocaleString("ru-RU")} /{" "}
                      {c.monthlyLimit.toLocaleString("ru-RU")} ₽
                    </span>
                  </div>
                  <div className="budget-bar">
                    <div
                      className="budget-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? "#F6C94D" : c.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </>
      )}
    </div>
  );
}
