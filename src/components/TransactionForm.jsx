import { useState } from "react";

export default function TransactionForm({
  categories,
  initial,
  onSubmit,
  onCancel,
}) {
  const [type, setType] = useState(initial?.type || "expense");
  const [amount, setAmount] = useState(initial?.amount || "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId || "");
  const [note, setNote] = useState(initial?.note || "");
  const [date, setDate] = useState(
    initial?.date || new Date().toISOString().slice(0, 10),
  );

  function handleSubmit(e) {
    e.preventDefault();
    if (!amount || !categoryId) return;
    onSubmit({
      type,
      amount: Number(amount),
      categoryId,
      note: note.trim(),
      date,
    });
  }

  const availableCategories = categories.filter(
    (c) => (c.type || "expense") === type,
  );

  function handleTypeChange(newType) {
    setType(newType);
    setCategoryId("");
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <div className="type-toggle">
        <button
          type="button"
          className={type === "expense" ? "active" : ""}
          onClick={() => handleTypeChange("expense")}
        >
          Расход
        </button>
        <button
          type="button"
          className={type === "income" ? "active" : ""}
          onClick={() => handleTypeChange("income")}
        >
          Доход
        </button>
      </div>

      <input
        type="number"
        placeholder="Сумма, ₽"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        required
      >
        <option value="">Выбери категорию</option>
        {availableCategories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {availableCategories.length === 0 && (
        <p className="empty-state">
          Нет категорий {type === "income" ? "доходов" : "расходов"} — добавь на
          странице «Категории».
        </p>
      )}

      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <input
        placeholder="Комментарий (необязательно)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Сохранить
        </button>
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  );
}
