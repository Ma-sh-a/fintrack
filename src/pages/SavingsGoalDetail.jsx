import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'

export default function SavingsGoalDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [goal, setGoal] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [deposits, setDeposits] = useState([])
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'goals', id))
      if (!snap.exists() || snap.data().userId !== user.uid) {
        setNotFound(true)
        return
      }
      setGoal({ id: snap.id, ...snap.data() })
    }
    if (user) load()
  }, [id, user])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'goalDeposits'), where('userId', '==', user.uid), where('goalId', '==', id))
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (a.date < b.date ? 1 : -1))
      setDeposits(list)
    })
  }, [user, id])

  async function handleAddDeposit(e) {
    e.preventDefault()
    if (!amount) return
    await addDoc(collection(db, 'goalDeposits'), {
      userId: user.uid,
      goalId: id,
      amount: Number(amount),
      note: note.trim(),
      date: new Date().toISOString().slice(0, 10),
    })
    setAmount('')
    setNote('')
  }

  async function handleDeleteDeposit(depId) {
    await deleteDoc(doc(db, 'goalDeposits', depId))
  }

  async function handleDeleteGoal() {
    await deleteDoc(doc(db, 'goals', id))
    navigate('/savings')
  }

  if (notFound) return <div className="page"><p>Цель не найдена.</p></div>
  if (!goal) return <div className="page-loading">Загрузка...</div>

  const saved = deposits.reduce((s, d) => s + Number(d.amount), 0)
  const pct = goal.targetAmount > 0 ? Math.min(100, Math.round((saved / goal.targetAmount) * 100)) : 0

  return (
    <div className="page">
      <button className="btn-link" onClick={() => navigate('/savings')}>← Назад к копилкам</button>
      <h1>{goal.name}</h1>

      <div className="card">
        <div className="budget-label">
          <span>{goal.kind === 'investment' ? 'Инвестиция' : 'Копилка'}</span>
          <span>{saved.toLocaleString('ru-RU')} / {goal.targetAmount.toLocaleString('ru-RU')} ₽ ({pct}%)</span>
        </div>
        <div className="budget-bar">
          <div className="budget-bar-fill" style={{ width: `${pct}%`, background: pct >= 100 ? '#447A5F' : '#EA6993' }} />
        </div>
      </div>

      <form className="inline-form" onSubmit={handleAddDeposit}>
        <input type="number" placeholder="Сумма пополнения, ₽" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input placeholder="Комментарий (необязательно)" value={note} onChange={(e) => setNote(e.target.value)} />
        <button className="btn-primary" type="submit">Пополнить</button>
      </form>

      <h2>История пополнений</h2>
      <ul className="transaction-list">
        {deposits.map((d) => (
          <li key={d.id} className="transaction-item">
            <div className="deposit-row">
              <span className="tx-date">{d.date}</span>
              <span className="tx-note">{d.note}</span>
              <span className="tx-amount positive">+{Number(d.amount).toLocaleString('ru-RU')} ₽</span>
              <button className="btn-link danger" onClick={() => handleDeleteDeposit(d.id)}>✕</button>
            </div>
          </li>
        ))}
        {deposits.length === 0 && <p className="empty-state">Пополнений пока не было.</p>}
      </ul>

      <button className="btn-secondary danger" style={{ marginTop: 24 }} onClick={handleDeleteGoal}>
        Удалить цель
      </button>
    </div>
  )
}
