import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import TransactionModal from '../components/TransactionModal'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, TRANSACTION_TYPES } from '../constants/finance'
import { useAuth } from '../context/useAuth'
import { formatCurrency, formatDate } from '../utils/format'
import {
  canCreateTransaction,
  canDeleteTransaction,
  canUpdateTransaction,
} from '../utils/permissions'

export default function TransactionsPage() {
  const { user } = useAuth()
  const role = user?.role

  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [typeDraft, setTypeDraft] = useState('')
  const [categoryDraft, setCategoryDraft] = useState('')
  const [searchDraft, setSearchDraft] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchFilter, setSearchFilter] = useState('')
  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('limit', '12')
    if (typeFilter) params.set('type', typeFilter)
    if (categoryFilter) params.set('category', categoryFilter)
    if (searchFilter.trim()) params.set('search', searchFilter.trim())
    try {
      const res = await api(`/transactions?${params.toString()}`)
      setItems(res.data || [])
      if (res.pagination) setPagination(res.pagination)
    } catch (e) {
      setItems([])
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [page, typeFilter, categoryFilter, searchFilter])

  useEffect(() => {
    load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }

  function openEdit(tx) {
    setEditing(tx)
    setModalOpen(true)
  }

  async function handleDelete(tx) {
    if (!canDeleteTransaction(role)) return
    if (!window.confirm(`Delete this ${tx.type} of ${formatCurrency(tx.amount)}?`)) return
    try {
      await api(`/transactions/${tx._id}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  function applyFilters(e) {
    e.preventDefault()
    setTypeFilter(typeDraft)
    setCategoryFilter(categoryDraft)
    setSearchFilter(searchDraft.trim())
    setPage(1)
  }

  const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Transactions</h1>
          <p className="text-muted">Search, filter, and manage entries</p>
        </div>
        {canCreateTransaction(role) ? (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            Add transaction
          </button>
        ) : (
          <p className="hint-banner">Viewer role: you can browse but not add or edit.</p>
        )}
      </header>

      <section className="card panel filters-panel">
        <form className="filters-form" onSubmit={applyFilters}>
          <label className="field compact">
            <span>Type</span>
            <select
              className="input select"
              value={typeDraft}
              onChange={(e) => {
                setTypeDraft(e.target.value)
                setCategoryDraft('')
              }}
            >
              <option value="">All</option>
              <option value={TRANSACTION_TYPES.INCOME}>Income</option>
              <option value={TRANSACTION_TYPES.EXPENSE}>Expense</option>
            </select>
          </label>
          <label className="field compact">
            <span>Category</span>
            <select
              className="input select"
              value={categoryDraft}
              onChange={(e) => setCategoryDraft(e.target.value)}
            >
              <option value="">All</option>
              {(typeDraft === TRANSACTION_TYPES.INCOME
                ? INCOME_CATEGORIES
                : typeDraft === TRANSACTION_TYPES.EXPENSE
                  ? EXPENSE_CATEGORIES
                  : allCategories
              ).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="field flex-grow">
            <span>Search</span>
            <input
              type="search"
              placeholder="Notes or category"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
            />
          </label>
          <div className="filter-actions">
            <button type="submit" className="btn btn-secondary">
              Apply
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setTypeDraft('')
                setCategoryDraft('')
                setSearchDraft('')
                setTypeFilter('')
                setCategoryFilter('')
                setSearchFilter('')
                setPage(1)
              }}
            >
              Reset
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="table-skel tall" aria-busy />
      ) : items.length === 0 ? (
        <div className="card panel empty-state">
          <p>No transactions match your filters.</p>
          {canCreateTransaction(role) ? (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              Add your first transaction
            </button>
          ) : null}
        </div>
      ) : (
        <div className="card panel flush">
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th className="num">Amount</th>
                  <th>Notes</th>
                  {(canUpdateTransaction(role) || canDeleteTransaction(role)) && (
                    <th className="actions-col">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {items.map((tx) => (
                  <tr key={tx._id}>
                    <td>{formatDate(tx.date)}</td>
                    <td>{tx.category}</td>
                    <td>
                      <span className={`type-pill type-${tx.type}`}>{tx.type}</span>
                    </td>
                    <td className={`num amt-${tx.type}`}>{formatCurrency(tx.amount)}</td>
                    <td className="cell-notes">{tx.notes || '—'}</td>
                    {(canUpdateTransaction(role) || canDeleteTransaction(role)) && (
                      <td className="actions-cell">
                        {canUpdateTransaction(role) ? (
                          <button type="button" className="btn btn-ghost btn-sm" onClick={() => openEdit(tx)}>
                            Edit
                          </button>
                        ) : null}
                        {canDeleteTransaction(role) ? (
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm danger"
                            onClick={() => handleDelete(tx)}
                          >
                            Delete
                          </button>
                        ) : null}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 ? (
            <footer className="pagination">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="text-muted">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </footer>
          ) : null}
        </div>
      )}

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        initial={editing}
        onSaved={load}
      />
    </div>
  )
}
