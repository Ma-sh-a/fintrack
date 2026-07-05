import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export function useCategories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    setError(null)
    const q = query(collection(db, 'categories'), where('userId', '==', user.uid))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        console.error('Ошибка загрузки категорий:', err)
        setError('Не удалось загрузить категории. Проверь соединение с интернетом.')
        setLoading(false)
      }
    )
    return unsub
  }, [user])

  return { categories, loading, error }
}
