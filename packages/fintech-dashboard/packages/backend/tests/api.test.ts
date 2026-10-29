import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { initDb, closeDb } from '../src/db'

beforeAll(async () => {
  // Set test database path
  process.env.DATABASE_URL = 'test.db'
  // Ensure DB is initialized before tests run
  try {
    await initDb()
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
})

afterAll(async () => {
  // Clean up database connection
  await closeDb()
})

describe('Backend API - /accounts', () => {
  it('GET /accounts returns 200 and an array', async () => {
    const res = await request(app).get('/accounts')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
  })
  it('GET /accounts/:id returns 200 for existing account', async () => {
    const res = await request(app).get('/accounts/A-001')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('id', 'A-001')
  })
  it('GET /accounts/:id returns 404 for missing', async () => {
    const res = await request(app).get('/accounts/UNKNOWN')
    expect(res.status).toBe(404)
  })
})

describe('Backend API - /transactions', () => {
  it('GET /transactions returns 200 with paginated data', async () => {
    const res = await request(app).get('/transactions')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('data')
    expect(res.body).toHaveProperty('pagination')
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.pagination).toHaveProperty('page')
    expect(res.body.pagination).toHaveProperty('limit')
    expect(res.body.pagination).toHaveProperty('total')
    expect(res.body.pagination).toHaveProperty('totalPages')
  })
  it('GET /transactions with invalid startDate returns 400', async () => {
    const res = await request(app).get('/transactions?startDate=not-a-date')
    expect(res.status).toBe(400)
  })
  it('GET /transactions with pagination params works', async () => {
    const res = await request(app).get('/transactions?page=1&limit=10')
    expect(res.status).toBe(200)
    expect(res.body.pagination.page).toBe(1)
    expect(res.body.pagination.limit).toBe(10)
  })
  it('GET /transactions with invalid page returns 400', async () => {
    const res = await request(app).get('/transactions?page=0')
    expect(res.status).toBe(400)
  })
})
