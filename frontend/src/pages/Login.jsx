import { useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const DEMO_CREDENTIALS = [
  {
    role: 'Viewer',
    email: 'viewer@gmail.com',
    password: 'viewer123',
    description: 'Can view dashboard and analytics only'
  },
  {
    role: 'Analyst',
    email: 'analyst@gmail.com',
    password: 'analyst123',
    description: 'Can view, create, and update transactions'
  },
  {
    role: 'Admin',
    email: 'admin@gmail.com',
    password: 'admin123',
    description: 'Full access including user management'
  }
]

export default function Login() {
  const { user, ready, login } = useAuth()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!ready) {
    return (
      <div className="page-loading">
        <div className="spinner" aria-hidden />
        <p>Loading…</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="brand-mark lg" aria-hidden />
          <h1>Welcome back</h1>
          <p className="text-muted">Sign in to your finance dashboard</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error ? (
            <div className="banner banner-error" role="alert">
              {error}
            </div>
          ) : null}

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer text-muted">
          No account? <Link to="/register">Create one</Link>
        </p>

        <div className="demo-credentials">
          <p className="demo-header">Demo Accounts</p>
          <div className="demo-list">
            {DEMO_CREDENTIALS.map((cred) => (
              <div key={cred.role} className="demo-card">
                <div className="demo-role">{cred.role}</div>
                <div className="demo-field">
                  <label>Email:</label>
                  <code>{cred.email}</code>
                </div>
                <div className="demo-field">
                  <label>Password:</label>
                  <code>{cred.password}</code>
                </div>
                <p className="demo-description">{cred.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
