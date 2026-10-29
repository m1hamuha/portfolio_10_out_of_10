export interface Account {
  id: string
  name: string
  balance: number
  currency: string
  type: string
}

export const accounts: Account[] = [
  { id: 'A-001', name: 'Main Checking', balance: 5789.25, currency: 'USD', type: 'checking' },
  { id: 'A-002', name: 'Savings', balance: 12045.11, currency: 'USD', type: 'savings' }
]

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  currency: string
  category: string
  accountId: string
}

export const transactions: Transaction[] = [
  { id: 'T-001', date: '2026-01-20', description: 'Salary', amount: 3500, currency: 'USD', category: 'income', accountId: 'A-001' },
  { id: 'T-002', date: '2026-01-21', description: 'Grocery', amount: -125.84, currency: 'USD', category: 'groceries', accountId: 'A-001' }
]
