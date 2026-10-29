import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TransactionsView } from '../TransactionsView'

// Mock the API module
vi.mock('../../services/api', () => ({
  default: {
    transactions: {
      getAll: vi.fn()
    },
    accounts: {
      getAll: vi.fn()
    }
  }
}))

import api from '../../services/api'

const mockAccounts = [
  { id: 'A-001', name: 'Main Checking', balance: 5789.25, currency: 'USD', type: 'checking' }
]

const mockTxResponse = {
  data: [
    {
      id: 'T-001',
      accountId: 'A-001',
      date: '2026-01-20',
      description: 'Coffee',
      amount: 4.5,
      currency: 'USD',
      category: 'food'
    }
  ],
  pagination: { total: 1, page: 1, totalPages: 1, limit: 50 }
}

describe('TransactionsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.transactions.getAll).mockResolvedValue(mockTxResponse)
    vi.mocked(api.accounts.getAll).mockResolvedValue(mockAccounts)
  })

  it('renders transactions after loading', async () => {
    render(<TransactionsView />)
    await waitFor(() => {
      expect(screen.getByText('Coffee')).toBeInTheDocument()
    })
    expect(api.transactions.getAll).toHaveBeenCalledTimes(1)
  })

  it('does not refetch while typing in a filter; fetches once on Apply', async () => {
    const user = userEvent.setup()
    render(<TransactionsView />)
    await waitFor(() => {
      expect(screen.getByText('Coffee')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('Category'), 'food')
    // give any (buggy) effect-triggered fetches a chance to fire
    await new Promise(r => setTimeout(r, 50))
    const callsAfterTyping = vi.mocked(api.transactions.getAll).mock.calls.length
    console.log(`[measure] getAll calls after initial load + typing 4 chars: ${callsAfterTyping}`)
    expect(callsAfterTyping).toBe(1)

    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => {
      expect(screen.getByText('Coffee')).toBeInTheDocument()
    })
    await new Promise(r => setTimeout(r, 50))
    const callsAfterApply = vi.mocked(api.transactions.getAll).mock.calls.length
    console.log(`[measure] getAll calls after Apply: ${callsAfterApply}`)
    expect(callsAfterApply).toBe(2)
  })

  it('applies filters when Enter is pressed in a filter input', async () => {
    const user = userEvent.setup()
    render(<TransactionsView />)
    await waitFor(() => {
      expect(screen.getByText('Coffee')).toBeInTheDocument()
    })

    await user.type(screen.getByLabelText('Category'), 'food{Enter}')
    await waitFor(() => {
      expect(vi.mocked(api.transactions.getAll).mock.calls.length).toBe(2)
    })
    // Enter must apply from page 1, same as clicking Apply
    expect(vi.mocked(api.transactions.getAll)).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: 'food', page: 1 })
    )
  })

  it('colors amounts by sign: credits green token, debits red token', async () => {
    vi.mocked(api.transactions.getAll).mockResolvedValue({
      data: [
        mockTxResponse.data[0], // amount 4.5 (credit)
        {
          id: 'T-002',
          accountId: 'A-001',
          date: '2026-01-21',
          description: 'Groceries',
          amount: -9.99,
          currency: 'USD',
          category: 'food'
        }
      ],
      pagination: { total: 2, page: 1, totalPages: 1, limit: 50 }
    })
    render(<TransactionsView />)
    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument()
    })
    const creditCell = screen.getByText(/USD 4\.50/).closest('td')
    const debitCell = screen.getByText(/USD -9\.99/).closest('td')
    expect(creditCell?.getAttribute('style')).toContain('--credit')
    expect(debitCell?.getAttribute('style')).toContain('--debit')
  })

  it('recovers from a failed load when Retry is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(api.transactions.getAll)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue(mockTxResponse)

    render(<TransactionsView />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    await waitFor(() => {
      expect(screen.getByText('Coffee')).toBeInTheDocument()
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
