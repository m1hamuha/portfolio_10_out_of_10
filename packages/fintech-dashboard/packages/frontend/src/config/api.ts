// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

export const API_URLS = {
  accounts: `${API_BASE_URL}/accounts`,
  transactions: `${API_BASE_URL}/transactions`,
  health: `${API_BASE_URL}/health`,
} as const

export default API_BASE_URL
