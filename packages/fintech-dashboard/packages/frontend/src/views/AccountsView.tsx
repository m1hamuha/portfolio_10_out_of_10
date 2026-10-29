import React, { useCallback, useEffect, useState } from 'react'
import api, { Account } from '../services/api'

export const AccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAccounts = useCallback(() => {
    setLoading(true)
    setError(null)
    api.accounts.getAll()
      .then((data) => setAccounts(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadAccounts()
  }, [loadAccounts])

  if (loading) return <div role="status" aria-live="polite">Loading accounts...</div>
  if (error) return (
    <div role="alert" style={{ color: 'red' }}>
      Error: {error}{' '}
      {/* Recovery path: a transient fetch failure must not brick the view
          until a full page reload. */}
      <button type="button" onClick={loadAccounts}>Retry</button>
    </div>
  )
  return (
    <div>
      <h2>Accounts</h2>
      <ul>
        {accounts.length === 0 ? (
          <li className="empty">No accounts found.</li>
        ) : (
          accounts.map(a => (
            <li key={a.id}>{a.name} — {a.currency} {a.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</li>
          ))
        )}
      </ul>
    </div>
  )
}
