// Lightweight API smoke tests for backend
import assert from 'assert/strict'

async function main() {
  const base = 'http://localhost:3002'
  const accRes = await fetch(`${base}/accounts`)
  const accounts = await accRes.json()
  const txnRes = await fetch(`${base}/transactions`)
  const transactions = await txnRes.json()

  console.log('Accounts count:', Array.isArray(accounts) ? accounts.length : 0)
  console.log('Transactions count:', Array.isArray(transactions) ? transactions.length : 0)

  assert.ok(accRes.ok, 'accounts endpoint not ok')
  assert.ok(txnRes.ok, 'transactions endpoint not ok')
  console.log('API smoke test: OK')
}

main().catch((err) => {
  console.error('API smoke test failed:', err)
  process.exit(1)
})
