import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { canAccessTransactionRecords } from '../utils/permissions'
import TransactionsPage from '../pages/TransactionsPage'

export default function TransactionRoute() {
  const { user, ready } = useAuth()

  if (!ready) {
    return (
      <div className="page-loading">
        <div className="spinner" aria-hidden />
        <p>Loading…</p>
      </div>
    )
  }

  if (!canAccessTransactionRecords(user?.role)) {
    return <Navigate to="/" replace />
  }

  return <TransactionsPage />
}
