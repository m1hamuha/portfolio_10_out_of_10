import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AccountsView } from '../AccountsView'

// Mock the API module
vi.mock('../../services/api', () => ({
  default: {
    accounts: {
      getAll: vi.fn()
    }
  }
}))

import api from '../../services/api'

describe('AccountsView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    vi.mocked(api.accounts.getAll).mockImplementation(() => new Promise(() => {}))
    render(<AccountsView />)
    expect(screen.getByText(/loading accounts/i)).toBeInTheDocument()
  })

  it('renders accounts after loading', async () => {
    const mockAccounts = [
      { id: 'A-001', name: 'Main Checking', balance: 5789.25, currency: 'USD', type: 'checking' },
      { id: 'A-002', name: 'Savings', balance: 12045.11, currency: 'USD', type: 'savings' }
    ]
    vi.mocked(api.accounts.getAll).mockResolvedValue(mockAccounts)
    
    render(<AccountsView />)
    
    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('Main Checking'))).toBeInTheDocument()
      expect(screen.getByText((content) => content.includes('Savings'))).toBeInTheDocument()
    })
  })

  it('renders error state when API fails', async () => {
    vi.mocked(api.accounts.getAll).mockRejectedValue(new Error('Network error'))

    render(<AccountsView />)

    await waitFor(() => {
      expect(screen.getByText(/error: network error/i)).toBeInTheDocument()
    })
  })

  it('recovers from a failed load when Retry is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(api.accounts.getAll)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce([
        { id: 'A-001', name: 'Main Checking', balance: 5789.25, currency: 'USD', type: 'checking' }
      ])

    render(<AccountsView />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    await waitFor(() => {
      expect(screen.getByText((content) => content.includes('Main Checking'))).toBeInTheDocument()
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
