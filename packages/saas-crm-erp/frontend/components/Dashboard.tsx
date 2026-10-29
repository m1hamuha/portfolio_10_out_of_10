'use client';

import React, { useState } from 'react';
import { RbacProvider, useRbac } from './RbacContext';
import { RbacSwitcher } from './RbacSwitcher';
import { KpiCards } from './KpiCards';
import { CustomersGrid } from './CustomersGrid';
import { DealsKanban } from './DealsKanban';
import { InvoicesLedger } from './InvoicesLedger';
import {
  TrendingUp,
  Users,
  Kanban,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle,
  Database,
  ExternalLink,
} from 'lucide-react';

type DashboardTab = 'overview' | 'customers' | 'deals' | 'invoices';

function DashboardContent() {
  const { resetDemoData } = useRbac();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [resetNotice, setResetNotice] = useState(false);

  const handleReset = () => {
    resetDemoData();
    setResetNotice(true);
    setTimeout(() => setResetNotice(false), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-indigo-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Skip to main content
      </a>

      {/* Top Enterprise Banner: Zero-Setup Mock Engine Status & 1-Click Reset */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-sm">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  SaaS CRM / ERP Platform
                </h1>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Zero-Setup Mock Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Deterministic Integer-Cent Financial Lifecycle (F28–F32)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {resetNotice && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded">
                <CheckCircle className="w-3.5 h-3.5" />
                Demo Data Pristine
              </span>
            )}

            <button
              type="button"
              data-testid="reset-demo-data-btn"
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Reset all customer, deal, and invoice states to initial enterprise defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <nav
          role="tablist"
          aria-label="Platform Views"
          className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-4 mb-6 overflow-x-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            data-testid="tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Executive Overview</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'customers'}
            data-testid="tab-customers"
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers Grid</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'deals'}
            data-testid="tab-deals"
            onClick={() => setActiveTab('deals')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'deals'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Kanban className="w-4 h-4" />
            <span>Deals Pipeline (Kanban)</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'invoices'}
            data-testid="tab-invoices"
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'invoices'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Invoices & Operations</span>
          </button>
        </nav>

        {/* Dynamic Interactive RBAC Persona Switcher (Universal across all tabs) */}
        <RbacSwitcher />

        {/* Tab Content Panels */}
        <main id="main-content">
          {activeTab === 'overview' && (
            <section role="tabpanel" aria-label="Executive Overview">
              <KpiCards />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <CustomersGrid />
                <InvoicesLedger />
              </div>
              <DealsKanban />
            </section>
          )}

          {activeTab === 'customers' && (
            <section role="tabpanel" aria-label="Customers View">
              <CustomersGrid />
            </section>
          )}

          {activeTab === 'deals' && (
            <section role="tabpanel" aria-label="Deals Kanban View">
              <DealsKanban />
            </section>
          )}

          {activeTab === 'invoices' && (
            <section role="tabpanel" aria-label="Invoices Ledger View">
              <InvoicesLedger />
            </section>
          )}
        </main>
      </div>

      {/* Footer & Cross-Navigation Note */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-500" />
            <span>Unified SaaS CRM / ERP Engine · Monorepo Showcase</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
            <a href="https://m1hamuha.github.io/portfolio/" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
              ← Central Portfolio Hub
            </a>
            <span>·</span>
            <a href="https://github.com/m1hamuha/portfolio_10_out_of_10" target="_blank" rel="noreferrer" className="hover:underline">
              GitHub Repository
            </a>
            <span>·</span>
            <span>Deterministic Integer-Cent Math Invariant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function Dashboard() {
  return (
    <RbacProvider>
      <DashboardContent />
    </RbacProvider>
  );
}