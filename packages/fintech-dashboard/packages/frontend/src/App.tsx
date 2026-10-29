import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { DashboardView } from './views/DashboardView'
import { AccountsView } from './views/AccountsView'
import { TransactionsView } from './views/TransactionsView'

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/accounts': 'Accounts',
  '/transactions': 'Transactions',
}

// Keep the window title in sync with the current route so browser tabs,
// history, bookmarks, and screen-reader window titles say which page this is
// (WCAG 2.4.2) instead of the same app name on every route.
function TitleSync(): null {
  const { pathname } = useLocation()
  useEffect(() => {
    const section = routeTitles[pathname]
    document.title = section ? `${section} — Fintech Dashboard` : 'Fintech Dashboard'
  }, [pathname])
  return null
}

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <TitleSync />
      <div className="dashboard">
        <header className="header">
          <h1 style={{ margin: 0, fontSize: 'inherit', fontWeight: 'inherit' }}>Fintech Dashboard</h1>
        </header>
        <nav aria-label="Primary" style={{ display: 'flex', gap: 8, padding: 12, justifyContent: 'center' }}>
          {[
            { to: '/', label: 'Dashboard', end: true },
            { to: '/accounts', label: 'Accounts', end: false },
            { to: '/transactions', label: 'Transactions', end: false },
          ].map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              style={({ isActive }) => ({
                fontWeight: isActive ? 700 : 400,
                textDecoration: isActive ? 'underline' : 'none',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <main className="content" style={{ paddingTop: 0 }}>
          <Routes>
            <Route path="/" element={<DashboardView />} />
            <Route path="/accounts" element={<AccountsView />} />
            <Route path="/transactions" element={<TransactionsView />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
