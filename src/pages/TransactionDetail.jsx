import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import TransactionForm from "../components/TransactionForm";

export default function TransactionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tx, setTx] = useState(null);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, "transactions", id));
      if (!snap.exists() || snap.data().userId !== user.uid) {
        setNotFound(true);
        return;
      }
      setTx({ id: snap.id, ...snap.data() });
    }
    if (user) load();
  }, [id, user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "categories"),
      where("userId", "==", user.uid),
    );
    return onSnapshot(q, (snap) =>
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
  }, [user]);

  async function handleUpdate(data) {
    await updateDoc(doc(db, "transactions", id), data);
    setTx({ id, ...data, userId: user.uid });
    setEditing(false);
  }

  async function handleDelete() {
    await deleteDoc(doc(db, "transactions", id));
    navigate("/transactions");
  }

  if (notFound)
    return (
      <div className="page">
        <p>Операция не найдена.</p>
      </div>
    );
  if (!tx) return <div className="page-loading">Загрузка...</div>;

  const categoryName =
    categories.find((c) => c.id === tx.categoryId)?.name || "—";

  return (
    <div className="page">
      <button className="btn-link" onClick={() => navigate("/transactions")}>
        ← Назад к списку
      </button>
      <h1>Операция</h1>

      {editing ? (
        <TransactionForm
          categories={categories}
          initial={tx}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="transaction-detail-card">
          <p>
            <strong>Тип:</strong> {tx.type === "income" ? "Доход" : "Расход"}
          </p>
          <p>
            <strong>Сумма:</strong> {Number(tx.amount).toLocaleString("ru-RU")}{" "}
            ₽
          </p>
          <p>
            <strong>Категория:</strong> {categoryName}
          </p>
          <p>
            <strong>Дата:</strong> {tx.date}
          </p>
          {tx.note && (
            <p>
              <strong>Комментарий:</strong> {tx.note}
            </p>
          )}
          <div className="form-actions">
            <button className="btn-primary" onClick={() => setEditing(true)}>
              Редактировать
            </button>
            <button className="btn-secondary danger" onClick={handleDelete}>
              Удалить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
