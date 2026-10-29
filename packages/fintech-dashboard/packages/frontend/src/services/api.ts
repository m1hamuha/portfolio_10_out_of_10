import API_BASE_URL from '../config/api'

// Generic API client with error handling
async function apiClient<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Types
export interface Account {
  id: string
  name: string
  balance: number
  currency: string
  type: string
}

export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  currency: string
  category: string
  accountId: string
}

export interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface TransactionsResponse {
  data: Transaction[]
  pagination: PaginationInfo
}

export interface TransactionFilters {
  accountId?: string
  startDate?: string
  endDate?: string
  category?: string
  minAmount?: string
  maxAmount?: string
  page?: number
  limit?: number
}

// API functions
export const api = {
  accounts: {
    getAll: (): Promise<Account[]> => 
      apiClient(`${API_BASE_URL}/accounts`),
    
    getById: (id: string): Promise<Account> => 
      apiClient(`${API_BASE_URL}/accounts/${id}`),
  },
  
  transactions: {
    getAll: (filters?: TransactionFilters): Promise<TransactionsResponse> => {
      const params = new URLSearchParams()
      if (filters?.accountId) params.append('accountId', filters.accountId)
      if (filters?.startDate) params.append('startDate', filters.startDate)
      if (filters?.endDate) params.append('endDate', filters.endDate)
      if (filters?.category) params.append('category', filters.category)
      if (filters?.minAmount) params.append('minAmount', filters.minAmount)
      if (filters?.maxAmount) params.append('maxAmount', filters.maxAmount)
      if (filters?.page) params.append('page', String(filters.page))
      if (filters?.limit) params.append('limit', String(filters.limit))
      
      const queryString = params.toString()
      return apiClient(`${API_BASE_URL}/transactions${queryString ? `?${queryString}` : ''}`)
    },
  },
  
  health: {
    check: (): Promise<{ status: string }> => 
      apiClient(`${API_BASE_URL}/health`),
  },
}

export default api
