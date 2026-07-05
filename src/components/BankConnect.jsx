import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";

const BANKS = [
  { id: "tbank", name: "Т-Банк", color: "#F6C94D" },
  { id: "sber", name: "СберБанк", color: "#447A5F" },
  { id: "alfa", name: "Альфа-Банк", color: "#EA6993" },
];

const MOCK_NOTES = [
  "Кофейня",
  "Такси",
  "Продукты",
  "Аптека",
  "Подписка",
  "Заправка",
];

export default function BankConnect({ expenseCategories }) {
  const { user } = useAuth();
  const [step, setStep] = useState("list");
  const [bank, setBank] = useState(null);
  const [importedCount, setImportedCount] = useState(0);

  function selectBank(b) {
    setBank(b);
    setStep("consent");
  }

  async function handleAllow() {
    setStep("loading");
    // реального соединения с банком нет
    await new Promise((r) => setTimeout(r, 1200));

    if (expenseCategories.length === 0) {
      setStep("no-categories");
      return;
    }

    const count = 4 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const cat =
        expenseCategories[Math.floor(Math.random() * expenseCategories.length)];
      const daysAgo = Math.floor(Math.random() * 20);
      const date = new Date(Date.now() - daysAgo * 86400000)
        .toISOString()
        .slice(0, 10);
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        type: "expense",
        amount: Math.round(150 + Math.random() * 3500),
        categoryId: cat.id,
        note: `${MOCK_NOTES[Math.floor(Math.random() * MOCK_NOTES.length)]} · импорт из ${bank.name}`,
        date,
        source: "bank_api_demo",
      });
    }
    setImportedCount(count);
    setStep("done");
  }

  function reset() {
    setStep("list");
    setBank(null);
  }

  return (
    <div className="card bank-connect">
      <h2>Синхронизация с банком (демо Open API)</h2>
      <p className="muted" style={{ marginBottom: 16 }}>
        Показывает, как выглядела бы автоматическая загрузка операций через Open
        Banking API. Реального соединения с банком нет.
      </p>

      {step === "list" && (
        <div className="bank-list">
          {BANKS.map((b) => (
            <button
              key={b.id}
              className="bank-item"
              onClick={() => selectBank(b)}
            >
              <span className="bank-dot" style={{ background: b.color }} />
              {b.name}
            </button>
          ))}
        </div>
      )}

      {step === "consent" && (
        <div className="bank-consent">
          <p>
            <strong>{bank.name}</strong> запрашивает доступ:
          </p>
          <ul className="consent-list">
            <li>✓ Просмотр истории операций за 90 дней</li>
            <li>✓ Просмотр баланса счёта</li>
          </ul>
          <div className="form-actions">
            <button className="btn-primary" onClick={handleAllow}>
              Разрешить доступ
            </button>
            <button className="btn-secondary" onClick={reset}>
              Отмена
            </button>
          </div>
        </div>
      )}

      {step === "loading" && (
        <p className="empty-state">Загружаем операции из {bank.name}...</p>
      )}

      {step === "no-categories" && (
        <div>
          <p className="empty-state">
            Сначала добавь хотя бы одну категорию расходов на странице
            «Категории».
          </p>
          <button className="btn-secondary" onClick={reset}>
            Назад
          </button>
        </div>
      )}

      {step === "done" && (
        <div>
          <p>
            Готово — импортировано {importedCount} операций из {bank.name}.
            Проверь список на странице «Операции».
          </p>
          <button className="btn-secondary" onClick={reset}>
            Подключить ещё один банк
          </button>
        </div>
      )}
    </div>
  );
}
