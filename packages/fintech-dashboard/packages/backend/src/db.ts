import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import path from 'path'

const DB_PATH = process.env.DATABASE_URL || path.resolve(process.cwd(), 'fintech.db')

let cachedDb: Database | null = null

async function getDb() {
  if (!cachedDb) {
    cachedDb = await open({ filename: DB_PATH, driver: sqlite3.Database })
  }
  return cachedDb
}

export async function initDb() {
  const db = await getDb()
  await db.exec(`CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT,
    balance REAL,
    currency TEXT,
    type TEXT
  )`)
  await db.exec(`CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    date TEXT,
    description TEXT,
    amount REAL,
    currency TEXT,
    category TEXT,
    accountId TEXT,
    FOREIGN KEY (accountId) REFERENCES accounts(id)
  )`)

  // Create indexes for better query performance
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_accountId ON transactions(accountId)`)
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)`)
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)`)
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_transactions_amount ON transactions(amount)`)

  // Seed accounts if empty
  const accCount = await db.get('SELECT COUNT(*) AS cnt FROM accounts')
  if (accCount?.cnt === 0) {
    await db.run(`INSERT INTO accounts (id, name, balance, currency, type) VALUES (?, ?, ?, ?, ?)`, ['A-001','Main Checking', 5789.25, 'USD', 'checking'])
    await db.run(`INSERT INTO accounts (id, name, balance, currency, type) VALUES (?, ?, ?, ?, ?)`, ['A-002','Savings', 12045.11, 'USD', 'savings'])
  }

  // Seed transactions if empty
  const txnCount = await db.get('SELECT COUNT(*) AS cnt FROM transactions')
  if (txnCount?.cnt === 0) {
    await db.run(`INSERT INTO transactions (id,date,description,amount,currency,category, accountId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['T-001','2026-01-20','Salary',3500,'USD','income','A-001'])
    await db.run(`INSERT INTO transactions (id,date,description,amount,currency,category, accountId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['T-002','2026-01-21','Grocery',-125.84,'USD','groceries','A-001'])
    await db.run(`INSERT INTO transactions (id,date,description,amount,currency,category, accountId) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['T-003','2026-01-22','Interest',15.67,'USD','income','A-002'])
  }
}

export async function getAccounts() {
  const db = await getDb()
  return db.all('SELECT id, name, balance, currency, type FROM accounts')
}

export async function getAccountById(id: string) {
  const db = await getDb()
  return db.get('SELECT id, name, balance, currency, type FROM accounts WHERE id = ?', id)
}

export async function getTransactions(filters?: {
  accountId?: string
  startDate?: string
  endDate?: string
  category?: string
  minAmount?: number
  maxAmount?: number
  page?: number
  limit?: number
}) {
  const db = await getDb()
  let sql = 'SELECT id, date, description, amount, currency, category, accountId FROM transactions WHERE 1=1'
  const params: unknown[] = []
  if (filters?.accountId) { sql += ' AND accountId = ?'; params.push(filters.accountId) }
  if (filters?.startDate) { sql += ' AND date(date) >= date(?)'; params.push(filters.startDate) }
  if (filters?.endDate) { sql += ' AND date(date) <= date(?)'; params.push(filters.endDate) }
  if (filters?.category) { sql += ' AND category = ?'; params.push(filters.category) }
  if (filters?.minAmount != null) { sql += ' AND amount >= ?'; params.push(filters.minAmount) }
  if (filters?.maxAmount != null) { sql += ' AND amount <= ?'; params.push(filters.maxAmount) }
  
  // Get total count for pagination
  const countResult = await db.get(`SELECT COUNT(*) as total FROM transactions WHERE 1=1`)
  const total = countResult?.total || 0
  
  // Add pagination
  const page = filters?.page || 1
  const limit = filters?.limit || 50
  const offset = (page - 1) * limit
  sql += ' ORDER BY date DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)
  
  const rows = await db.all(sql, params)
  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

export async function closeDb() {
  if (cachedDb) {
    await cachedDb.close()
    cachedDb = null
  }
}
