import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    setError(null)
    const q = query(collection(db, 'transactions'), where('userId', '==', user.uid))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('Ошибка загрузки транзакций:', err)
        setError('Не удалось загрузить операции. Проверь соединение с интернетом.')
        setLoading(false)
      }
    )
    return unsub
  }, [user])

  return { transactions, loading, error }
}
