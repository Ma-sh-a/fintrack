import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="navbar-brand">FinFlow</div>
      <div className="navbar-links">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Дашборд
        </NavLink>
        <NavLink
          to="/transactions"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Операции
        </NavLink>
        <NavLink
          to="/categories"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Категории
        </NavLink>
        <NavLink
          to="/savings"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Копилки
        </NavLink>
        <NavLink
          to="/investments"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Инвестиции
        </NavLink>
        <NavLink
          to="/connections"
          className={({ isActive }) => (isActive ? "active" : "")}
        >
          Интеграции
        </NavLink>
      </div>
      <div className="navbar-user">
        <span>{user.email}</span>
        <button onClick={handleLogout} className="btn-link">
          Выйти
        </button>
      </div>
    </nav>
  );
}
