import React, { useCallback, useEffect, useState } from 'react'
import { BalanceCard } from '../components/BalanceCard'
import { BarChart } from '../components/BarChart'
import api, { Account } from '../services/api'

export const DashboardView: React.FC = () => {
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

  const total = accounts.reduce((sum, a) => sum + (a.balance ?? 0), 0)
  const data = accounts.map(a => ({ label: a.name, value: a.balance }))

  if (loading) return <div role="status" aria-live="polite">Loading dashboard...</div>
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
      <h2>Dashboard</h2>
      <BalanceCard total={total} currency="USD" />
      <div style={{ marginTop: 20 }}>
        <BarChart data={data} height={180} />
      </div>
    </div>
  )
}
