import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import CategoryChart from '../components/CategoryChart'
import TrendChart from '../components/TrendChart'
import ChatAssistant from '../components/ChatAssistant'

const MONTH_LABELS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

function shiftMonth(monthStr, delta) {
  const [y, m] = monthStr.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function Dashboard() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [goals, setGoals] = useState([])
  const [deposits, setDeposits] = useState([])
  const [investments, setInvestments] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    if (!user) return
    const unsubs = [
      onSnapshot(query(collection(db, 'transactions'), where('userId', '==', user.uid)), (snap) =>
        setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(query(collection(db, 'categories'), where('userId', '==', user.uid)), (snap) =>
        setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(query(collection(db, 'goals'), where('userId', '==', user.uid)), (snap) =>
        setGoals(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(query(collection(db, 'goalDeposits'), where('userId', '==', user.uid)), (snap) =>
        setDeposits(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
      onSnapshot(query(collection(db, 'investments'), where('userId', '==', user.uid)), (snap) =>
        setInvestments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      ),
    ]
    return () => unsubs.forEach((u) => u())
  }, [user])

  const monthTx = useMemo(
    () => transactions.filter((t) => t.date?.startsWith(selectedMonth)),
    [transactions, selectedMonth]
  )

  const income = monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const expense = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = income - expense

  const chartData = useMemo(() => {
    return categories
      .filter((c) => (c.type || 'expense') === 'expense')
      .map((c) => {
        const sum = monthTx
          .filter((t) => t.type === 'expense' && t.categoryId === c.id)
          .reduce((s, t) => s + Number(t.amount), 0)
        return { name: c.name, value: sum, color: c.color }
      })
      .filter((c) => c.value > 0)
  }, [categories, monthTx])

  const overLimitCats = useMemo(() => {
    return categories
      .filter((c) => (c.type || 'expense') === 'expense' && c.monthlyLimit > 0)
      .map((c) => {
        const spent = monthTx
          .filter((t) => t.type === 'expense' && t.categoryId === c.id)
          .reduce((s, t) => s + Number(t.amount), 0)
        const overPct = Math.round(((spent - c.monthlyLimit) / c.monthlyLimit) * 100)
        return { ...c, spent, overPct }
      })
      .filter((c) => c.spent > c.monthlyLimit)
      .sort((a, b) => b.overPct - a.overPct)
  }, [categories, monthTx])

  const savingsTotal = useMemo(() => {
    const savingGoalIds = goals.filter((g) => (g.kind || 'saving') === 'saving').map((g) => g.id)
    return deposits.filter((d) => savingGoalIds.includes(d.goalId)).reduce((s, d) => s + Number(d.amount), 0)
  }, [goals, deposits])

  const investmentsTotal = useMemo(
    () => investments.reduce((s, a) => s + Number(a.quantity || 0) * Number(a.currentPrice || 0), 0),
    [investments]
  )

  const trendData = useMemo(() => {
    const months = []
    for (let i = 5; i >= 0; i--) months.push(shiftMonth(selectedMonth, -i))
    return months.map((m) => {
      const tx = transactions.filter((t) => t.date?.startsWith(m))
      const [y, mo] = m.split('-').map(Number)
      return {
        month: m,
        label: `${MONTH_LABELS[mo - 1]} ${String(y).slice(2)}`,
        income: tx.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
        expense: tx.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
      }
    })
  }, [transactions, selectedMonth])

  const monthLabel = new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ marginBottom: 0 }}>Дашборд</h1>
        <div className="month-switcher">
          <button className="btn-link" onClick={() => setSelectedMonth((m) => shiftMonth(m, -1))}>←</button>
          <span className="month-label">{monthLabel}</span>
          <button className="btn-link" onClick={() => setSelectedMonth((m) => shiftMonth(m, 1))}>→</button>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-label">Доход за месяц</span>
          <span className="stat-value positive">{income.toLocaleString('ru-RU')} ₽</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Расход за месяц</span>
          <span className="stat-value negative">{expense.toLocaleString('ru-RU')} ₽</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Баланс</span>
          <span className={`stat-value ${balance >= 0 ? 'positive' : 'negative'}`}>
            {balance.toLocaleString('ru-RU')} ₽
          </span>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <span className="stat-label">В копилках</span>
          <span className="stat-value">{savingsTotal.toLocaleString('ru-RU')} ₽</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">В инвестициях</span>
          <span className="stat-value">{investmentsTotal.toLocaleString('ru-RU')} ₽</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Всего накоплений</span>
          <span className="stat-value positive">{(savingsTotal + investmentsTotal).toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>

      <div className="card">
        <h2>Превышения лимитов в этом месяце</h2>
        {overLimitCats.length === 0 ? (
          <p className="empty-state">Лимиты не превышены ни по одной категории.</p>
        ) : (
          <ul className="overlimit-list">
            {overLimitCats.map((c) => (
              <li key={c.id} className="overlimit-item">
                <span className="category-dot" style={{ background: c.color }} />
                <span className="overlimit-name">{c.name}</span>
                <span className="overlimit-amounts muted">
                  {c.spent.toLocaleString('ru-RU')} / {c.monthlyLimit.toLocaleString('ru-RU')} ₽
                </span>
                <span className="overlimit-pct">+{c.overPct}%</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>Расходы по категориям</h2>
        <CategoryChart data={chartData} />
      </div>

      <div className="card">
        <h2>Динамика по месяцам</h2>
        <TrendChart data={trendData} />
      </div>

      <ChatAssistant
        transactions={transactions}
        monthTx={monthTx}
        categories={categories}
        goals={goals}
        deposits={deposits}
        investments={investments}
        selectedMonth={selectedMonth}
      />
    </div>
  )
}
