import { useMemo, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import BankConnect from '../components/BankConnect'
import ErrorBanner from '../components/ErrorBanner'
import { useCategories } from '../hooks/useCategories'

// Демо-ключ: детерминированно генерируется из uid пользователя, чтобы выглядеть
// как настоящий персональный API-ключ. Никакого реального доступа он не даёт.
function generateApiKey(uid) {
  const raw = btoa(unescape(encodeURIComponent(uid))).replace(/[^a-zA-Z0-9]/g, '')
  return `ff_live_${raw.slice(0, 28).toLowerCase()}`
}

export default function Connections() {
  const { user } = useAuth()
  const { categories, loading, error } = useCategories()
  const [copied, setCopied] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const apiKey = useMemo(() => (user ? generateApiKey(user.uid) : ''), [user])
  const expenseCategories = categories.filter((c) => (c.type || 'expense') === 'expense')

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(apiKey)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard недоступен — молча игнорируем */
    }
  }

  return (
    <div className="page">
      <h1>Интеграции</h1>

      <ErrorBanner message={error} />

      {loading ? (
        <p className="empty-state">Загрузка...</p>
      ) : (
        <>
          <div className="card">
            <h2>Ваш персональный API-ключ</h2>
            <p className="muted" style={{ marginBottom: 14 }}>
              Демо-ключ для подключения внешних сервисов (банков, брокеров) к вашему аккаунту FinFlow. Это
              учебная имитация — реального API за ключом нет.
            </p>
            <div className="api-key-row">
              <code className="api-key-value">{revealed ? apiKey : '•'.repeat(apiKey.length)}</code>
              <button className="btn-secondary" onClick={() => setRevealed((r) => !r)}>
                {revealed ? 'Скрыть' : 'Показать'}
              </button>
              <button className="btn-primary" onClick={handleCopy}>
                {copied ? 'Скопировано ✓' : 'Копировать'}
              </button>
            </div>
          </div>

          <BankConnect expenseCategories={expenseCategories} />
        </>
      )}
    </div>
  )
}
