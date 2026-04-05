import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { categoriesForType, TRANSACTION_TYPES } from '../constants/finance'
import { toInputDate } from '../utils/format'

const emptyForm = {
  amount: '',
  type: TRANSACTION_TYPES.EXPENSE,
  category: '',
  date: '',
  notes: '',
}

export default function TransactionModal({ open, onClose, onSaved, initial }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setError('')
    if (initial) {
      setForm({
        amount: String(initial.amount ?? ''),
        type: initial.type || TRANSACTION_TYPES.EXPENSE,
        category: initial.category || '',
        date: toInputDate(initial.date) || new Date().toISOString().slice(0, 10),
        notes: initial.notes || '',
      })
    } else {
      setForm({
        ...emptyForm,
        date: new Date().toISOString().slice(0, 10),
        type: TRANSACTION_TYPES.EXPENSE,
        category: categoriesForType(TRANSACTION_TYPES.EXPENSE)[0],
      })
    }
  }, [open, initial])

  const cats = categoriesForType(form.type)

  useEffect(() => {
    if (!open || initial) return
    if (!cats.includes(form.category)) {
      setForm((f) => ({ ...f, category: cats[0] || '' }))
    }
  }, [form.type, open, initial, cats, form.category])

  if (!open) return null

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = {
      amount: parseFloat(form.amount, 10),
      type: form.type,
      category: form.category,
      date: new Date(form.date).toISOString(),
      notes: form.notes || '',
    }
    try {
      if (initial?._id) {
        await api(`/transactions/${initial._id}`, { method: 'PUT', json: payload })
      } else {
        await api('/transactions', { method: 'POST', json: payload })
      }
      onSaved?.()
      onClose()
    } catch (err) {
      const msg =
        err.data?.errors?.map((x) => `${x.field}: ${x.message}`).join(' ') ||
        err.message ||
        'Save failed'
      setError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tx-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-head">
          <h2 id="tx-modal-title">{initial ? 'Edit transaction' : 'New transaction'}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <form className="modal-body" onSubmit={handleSubmit}>
          {error ? (
            <div className="banner banner-error" role="alert">
              {error}
            </div>
          ) : null}

          <label className="field">
            <span>Amount</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Type</span>
              <select
                className="input select"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value, category: '' })}
              >
                <option value={TRANSACTION_TYPES.INCOME}>Income</option>
                <option value={TRANSACTION_TYPES.EXPENSE}>Expense</option>
              </select>
            </label>
            <label className="field">
              <span>Category</span>
              <select
                className="input select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
              >
                {cats.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="field">
            <span>Date</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </label>

          <label className="field">
            <span>Notes</span>
            <textarea
              rows={3}
              maxLength={500}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </label>

          <footer className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  )
}
