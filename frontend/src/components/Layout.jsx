import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { canAccessTransactionRecords } from '../utils/permissions'

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden />
          <div>
            <strong>Ledger</strong>
            <span className="brand-sub">Finance</span>
          </div>
        </div>

        <nav className="side-nav" aria-label="Main">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'side-link is-active' : 'side-link')}>
            Dashboard
          </NavLink>
          {canAccessTransactionRecords(user?.role) ? (
            <NavLink
              to="/transactions"
              className={({ isActive }) => (isActive ? 'side-link is-active' : 'side-link')}
            >
              Transactions
            </NavLink>
          ) : null}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="user-avatar" aria-hidden>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
            <div className="user-meta">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => logout()}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <Outlet />
      </div>
    </div>
  )
}
