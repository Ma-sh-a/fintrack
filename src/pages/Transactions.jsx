import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import { collection, addDoc, onSnapshot, query, where } from 'firebase/firestore'
import TransactionForm from '../components/TransactionForm'
import ErrorBanner from '../components/ErrorBanner'
import { sortByDateDesc, filterTransactions, filterCategoriesByType } from '../utils/transactionFilters'
import { useTransactions } from '../hooks/useTransactions'

export default function Transactions() {
  const { user } = useAuth()
  const { transactions: rawTransactions, loading, error: txError } = useTransactions()
  const transactions = sortByDateDesc(rawTransactions)
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [catError, setCatError] = useState(null)
  const error = txError || catError

  useEffect(() => {
    if (!user) return
    setCatError(null)
    const qCat = query(collection(db, 'categories'), where('userId', '==', user.uid))
    const unsubCat = onSnapshot(
      qCat,
      (snap) => setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.error('Ошибка загрузки категорий:', err)
        setCatError('Не удалось загрузить категории.')
      }
    )
    return unsubCat
  }, [user])

  async function handleAdd(data) {
    await addDoc(collection(db, 'transactions'), { ...data, userId: user.uid })
    setShowForm(false)
  }

  function categoryName(id) {
    return categories.find((c) => c.id === id)?.name || '—'
  }

  function handleFilterTypeChange(newType) {
    setFilterType(newType)
    setFilterCategory('all')
  }

  const filterableCategories = filterCategoriesByType(categories, filterType)

  const filtered = filterTransactions(transactions, { type: filterType, categoryId: filterCategory })

  return (
    <div className="page">
      <div className="page-header">
        <h1>Операции</h1>
        <button className="btn-primary" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Закрыть' : '+ Добавить операцию'}
        </button>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <p className="empty-state">Загрузка операций...</p>
      ) : (
        <>
          {showForm && (
            <TransactionForm
              categories={categories}
              onSubmit={handleAdd}
              onCancel={() => setShowForm(false)}
            />
          )}

          <div className="filters">
            <select value={filterType} onChange={(e) => handleFilterTypeChange(e.target.value)}>
              <option value="all">Все типы</option>
              <option value="income">Доходы</option>
              <option value="expense">Расходы</option>
            </select>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">Все категории</option>
              {filterableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <ul className="transaction-list">
            {filtered.map((t) => (
              <li key={t.id} className="transaction-item">
                <Link to={`/transactions/${t.id}`}>
                  <span className={`tx-type tx-${t.type}`}>{t.type === 'income' ? '+' : '−'}</span>
                  <span className="tx-category">{categoryName(t.categoryId)}</span>
                  <span className="tx-note">{t.note}</span>
                  <span className="tx-date">{t.date}</span>
                  <span className={`tx-amount tx-${t.type}`}>
                    {t.type === 'income' ? '+' : '−'}
                    {Number(t.amount).toLocaleString('ru-RU')} ₽
                  </span>
                </Link>
              </li>
            ))}
            {filtered.length === 0 && <p className="empty-state">Операций не найдено.</p>}
          </ul>
        </>
      )}
    </div>
  )
}
