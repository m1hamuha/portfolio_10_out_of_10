import React from 'react'

type Account = { id: string; name: string }
type Transaction = {
  id: string
  date: string
  description: string
  amount: number
  currency: string
  category: string
  accountId: string
}

export const TransactionTable: React.FC<{ transactions: Transaction[]; accounts: Account[] }> = ({ transactions, accounts }) => {
  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name ?? id
  if (!transactions || transactions.length === 0) {
    return <div className="empty">No transactions</div>
  }
  return (
    <table className="transactions-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Account</th>
          <th>Category</th>
        </tr>
      </thead>
      <tbody>
        {transactions.map(t => (
          <tr key={t.id}>
            <td>{t.date}</td>
            <td>{t.description}</td>
            <td>{t.currency} {t.amount.toFixed(2)}</td>
            <td>{getAccountName(t.accountId)}</td>
            <td>{t.category}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
