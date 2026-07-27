import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore'
import CircularProgress from '../components/CircularProgress'
import ErrorBanner from '../components/ErrorBanner'

export default function SavingsGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [deposits, setDeposits] = useState([])
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formError, setFormError] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    setError(null)
    const qGoals = query(collection(db, 'goals'), where('userId', '==', user.uid))
    const unsubGoals = onSnapshot(
      qGoals,
      (snap) => {
        setGoals(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((g) => (g.kind || 'saving') === 'saving')
        )
        setLoading(false)
      },
      (err) => {
        console.error('Ошибка загрузки копилок:', err)
        setError('Не удалось загрузить копилки. Проверь соединение с интернетом.')
        setLoading(false)
      }
    )
    const qDep = query(collection(db, 'goalDeposits'), where('userId', '==', user.uid))
    const unsubDep = onSnapshot(
      qDep,
      (snap) => setDeposits(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error('Ошибка загрузки пополнений:', err)
    )
    return () => {
      unsubGoals()
      unsubDep()
    }
  }, [user])

  async function handleAdd(e) {
    e.preventDefault()
    setFormError('')

    if (!name.trim()) {
      setFormError('Укажи название копилки')
      return
    }
    const numTarget = Number(target)
    if (!target || Number.isNaN(numTarget) || numTarget <= 0) {
      setFormError('Целевая сумма должна быть больше нуля')
      return
    }

    await addDoc(collection(db, 'goals'), {
      userId: user.uid,
      name: name.trim(),
      kind: 'saving',
      targetAmount: numTarget,
      createdAt: new Date().toISOString().slice(0, 10),
    })
    setName('')
    setTarget('')
    setShowForm(false)
  }

  async function handleDelete(id, e) {
    e.preventDefault()
    e.stopPropagation()
    await deleteDoc(doc(db, 'goals', id))
  }

  function savedFor(goalId) {
    return deposits.filter((d) => d.goalId === goalId).reduce((s, d) => s + Number(d.amount), 0)
  }

  function renderGoal(g) {
    const saved = savedFor(g.id)
    const pct = g.targetAmount > 0 ? Math.round((saved / g.targetAmount) * 100) : 0
    return (
      <Link to={`/savings/${g.id}`} key={g.id} className="goal-card">
        <div className="goal-badge goal-badge-saving">● Копилка</div>
        <div className="goal-card-body">
          <CircularProgress pct={pct} color="#EA6993" />
          <div className="goal-card-info">
            <span className="goal-card-name">{g.name}</span>
            <span className="goal-card-amounts">
              {saved.toLocaleString('ru-RU')} ₽
              <span className="muted"> из {g.targetAmount.toLocaleString('ru-RU')} ₽</span>
            </span>
          </div>
        </div>
        <button className="btn-link danger goal-delete" onClick={(e) => handleDelete(g.id, e)}>
          Удалить
        </button>
      </Link>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ marginBottom: 0 }}>Копилки</h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Закрыть' : '+ Новая копилка'}
        </button>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <p className="empty-state">Загрузка копилок...</p>
      ) : (
        <>
          {showForm && (
            <form className="transaction-form" onSubmit={handleAdd} noValidate>
              <input
                placeholder="Название (например «Подушка безопасности»)"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Целевая сумма, ₽"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
              {formError && <p className="auth-error">{formError}</p>}
              <button className="btn-primary" type="submit">
                Создать
              </button>
            </form>
          )}

          <div className="goal-grid">{goals.map(renderGoal)}</div>
          {goals.length === 0 && (
            <div className="empty-state-action">
              <p className="empty-state">Пока нет ни одной копилки.</p>
              <button className="btn-primary" onClick={() => setShowForm(true)}>
                + Создать первую копилку
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
