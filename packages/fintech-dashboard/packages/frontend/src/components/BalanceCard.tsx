import React from 'react'

export const BalanceCard: React.FC<{ total: number; currency?: string }> = ({ total, currency = 'USD' }) => {
  return (
    <div className="card balance-card">
      <div className="card-title">Total Balance</div>
      <div className="card-amount">{currency} {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
    </div>
  )
}
