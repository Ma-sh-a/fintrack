import { useAuth } from '../contexts/AuthContext'

export default function Profile() {
  const { user } = useAuth()

  return (
    <div className="page">
      <h1>Профиль</h1>
      <div className="card">
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
        <p>
          <strong>ID пользователя:</strong> {user?.uid}
        </p>
      </div>
      <div className="card">
        <h2>Тестовый доступ</h2>
        <p>
          Для проверки комиссией используйте тестовый аккаунт:
          <br />
          <code>demo@gmail.com</code> / <code>demo13</code>
        </p>
        <p className="muted">Аккаунт заранее наполнен тестовыми данными.</p>
      </div>
    </div>
  )
}
