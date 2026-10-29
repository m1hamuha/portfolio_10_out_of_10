import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DashboardView } from '../DashboardView'

vi.mock('../../services/api', () => ({
  default: {
    accounts: {
      getAll: vi.fn()
    }
  }
}))

import api from '../../services/api'

describe('DashboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    vi.mocked(api.accounts.getAll).mockImplementation(() => new Promise(() => {}))
    render(<DashboardView />)
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument()
  })

  it('renders total balance after loading', async () => {
    const mockAccounts = [
      { id: 'A-001', name: 'Main Checking', balance: 5000, currency: 'USD', type: 'checking' },
      { id: 'A-002', name: 'Savings', balance: 3000, currency: 'USD', type: 'savings' }
    ]
    vi.mocked(api.accounts.getAll).mockResolvedValue(mockAccounts)
    
    render(<DashboardView />)
    
    await waitFor(() => {
      expect(screen.getByText(/total balance/i)).toBeInTheDocument()
      // Check for the amount using a more flexible matcher due to locale formatting
      expect(screen.getByText((content) => content.includes('8000') || content.includes('8.000') || content.includes('8,000'))).toBeInTheDocument()
    })
  })

  it('renders bar chart after loading', async () => {
    const mockAccounts = [
      { id: 'A-001', name: 'Main Checking', balance: 5000, currency: 'USD', type: 'checking' }
    ]
    vi.mocked(api.accounts.getAll).mockResolvedValue(mockAccounts)
    
    render(<DashboardView />)
    
    await waitFor(() => {
      expect(screen.getByText('Main Checking')).toBeInTheDocument()
    })
  })

  it('renders error state when API fails', async () => {
    vi.mocked(api.accounts.getAll).mockRejectedValue(new Error('API Error'))

    render(<DashboardView />)

    await waitFor(() => {
      expect(screen.getByText(/error: api error/i)).toBeInTheDocument()
    })
  })

  it('recovers from a failed load when Retry is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(api.accounts.getAll)
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce([
        { id: 'A-001', name: 'Main Checking', balance: 5000, currency: 'USD', type: 'checking' }
      ])

    render(<DashboardView />)

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'Retry' }))

    await waitFor(() => {
      expect(screen.getByText(/total balance/i)).toBeInTheDocument()
    })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
