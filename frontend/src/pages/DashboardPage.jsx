import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import TrendChart from '../components/TrendChart'
import { useAuth } from '../context/useAuth'
import { canAccessTransactionRecords } from '../utils/permissions'
import { formatCurrency, formatDate } from '../utils/format'

const PERIODS = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const showTxNav = canAccessTransactionRecords(user?.role)

  const [period, setPeriod] = useState('month')
  const [overview, setOverview] = useState(null)
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)
  const [trendsLoading, setTrendsLoading] = useState(true)
  const [error, setError] = useState('')
  const [trendError, setTrendError] = useState('')

  const loadOverview = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const res = await api(`/dashboard/overview?period=${period}`)
      setOverview(res.data)
    } catch (e) {
      setOverview(null)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [period])

  const loadTrends = useCallback(async () => {
    setTrendError('')
    setTrendsLoading(true)
    try {
      const res = await api('/dashboard/trends?period=monthly&months=6')
      setTrends(res.data || [])
    } catch (e) {
      setTrends([])
      setTrendError(e.message)
    } finally {
      setTrendsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOverview()
  }, [loadOverview])

  useEffect(() => {
    loadTrends()
  }, [loadTrends])

  const summary = overview?.summary
  const comparison = overview?.comparison
  const topCategories = overview?.topCategories || []
  const recent = overview?.recentTransactions || []

  function changePct(val) {
    const n = Number(val)
    if (Number.isNaN(n)) return '—'
    const sign = n > 0 ? '+' : ''
    return `${sign}${n}%`
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted">Income, spending, and recent activity</p>
        </div>
        <div className="toolbar">
          <label className="select-wrap">
            <span className="sr-only">Period</span>
            <select
              className="input select"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          {showTxNav ? (
            <Link to="/transactions" className="btn btn-secondary">
              All transactions
            </Link>
          ) : null}
        </div>
      </header>

      {user?.role === 'viewer' ? (
        <p className="role-hint text-muted">
          You are signed in as a <strong>viewer</strong>: shared dashboard and insights only. Ask an admin to
          grant <strong>analyst</strong> if you need the full transaction list.
        </p>
      ) : null}

      {error ? (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid-stats skeleton-grid" aria-busy>
          {[1, 2, 3].map((i) => (
            <div key={i} className="card stat-card skel" />
          ))}
        </div>
      ) : (
        <section className="grid-stats" aria-label="Summary">
          <article className="card stat-card stat-income">
            <h2>Total income</h2>
            <p className="stat-value">{formatCurrency(summary?.totalIncome)}</p>
            <p className="stat-meta">{summary?.incomeCount ?? 0} transactions</p>
            {comparison ? (
              <p className="stat-delta pos">vs prior: {changePct(comparison.incomeChange)}</p>
            ) : null}
          </article>
          <article className="card stat-card stat-expense">
            <h2>Total expenses</h2>
            <p className="stat-value">{formatCurrency(summary?.totalExpense)}</p>
            <p className="stat-meta">{summary?.expenseCount ?? 0} transactions</p>
            {comparison ? (
              <p className="stat-delta neg">vs prior: {changePct(comparison.expenseChange)}</p>
            ) : null}
          </article>
          <article className="card stat-card stat-balance">
            <h2>Net balance</h2>
            <p className="stat-value">{formatCurrency(summary?.netBalance)}</p>
            <p className="stat-meta">After expenses in selected period</p>
          </article>
        </section>
      )}

      <div className="grid-panels">
        <section className="card panel">
          <h2 className="panel-title">Cash flow trend</h2>
          <p className="text-muted panel-sub">Last several months (from your data)</p>
          <TrendChart trends={trends} loading={trendsLoading} error={trendError} />
        </section>

        <section className="card panel">
          <h2 className="panel-title">Top categories</h2>
          <p className="text-muted panel-sub">Highest spend and income in this period</p>
          {!loading && topCategories.length === 0 ? (
            <p className="text-muted">No category data for this range.</p>
          ) : (
            <ul className="category-list">
              {topCategories.map((row, idx) => {
                const cat = row._id?.category ?? row.category
                const typ = row._id?.type ?? row.type
                return (
                  <li key={`${cat}-${typ}-${idx}`} className="category-row">
                    <span className={`type-pill type-${typ}`}>{typ}</span>
                    <span className="category-name">{cat}</span>
                    <span className="category-amt">{formatCurrency(row.total)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      <section className="card panel full">
        <div className="panel-head">
          <h2 className="panel-title">Recent activity</h2>
          {showTxNav ? (
            <Link to="/transactions" className="link-arrow">
              View all
            </Link>
          ) : null}
        </div>
        {loading ? (
          <div className="table-skel" aria-busy />
        ) : recent.length === 0 ? (
          <p className="text-muted">No transactions yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((tx) => (
                  <tr key={tx._id}>
                    <td>{formatDate(tx.date)}</td>
                    <td>{tx.category}</td>
                    <td>
                      <span className={`type-pill type-${tx.type}`}>{tx.type}</span>
                    </td>
                    <td className={`num amt-${tx.type}`}>{formatCurrency(tx.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
