'use client';

import React from 'react';
import { useRbac } from './RbacContext';
import { formatCents } from '@/lib/crmBackend';
import { DollarSign, TrendingUp, Users, Award } from 'lucide-react';

export const KpiCards: React.FC = () => {
  const { kpis, can } = useRbac();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Pipeline Value */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Active Pipeline</span>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="kpi-pipeline-value">
          {formatCents(kpis.totalPipelineCents)}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
          <span className="text-emerald-600 font-semibold">Active deals</span> in qualification & proposal
        </p>
      </div>

      {/* 2. Collected Revenue */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Collected Revenue</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="kpi-collected-revenue">
          {can('finance:view_ledger') ? formatCents(kpis.collectedRevenueCents) : '••••••••'}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {can('finance:view_ledger') ? (
            <span className="text-emerald-600 font-semibold">100% verified</span>
          ) : (
            <span className="text-amber-600 font-semibold">Gated for SalesRep</span>
          )}{' '}
          via paid invoices
        </p>
      </div>

      {/* 3. Customers & Average LTV */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Active Customers</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="kpi-customer-count">
          {kpis.activeCustomerCount} Accounts
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Avg LTV:{' '}
          <strong className="text-slate-700 dark:text-slate-300 font-semibold">
            {formatCents(kpis.averageLtvCents)}
          </strong>
        </p>
      </div>

      {/* 4. Win Rate */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Deal Win Rate</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="kpi-win-rate">
          {kpis.winRatePercentage}%
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-slate-600 dark:text-slate-400">
          Conversion on closed pipeline
        </p>
      </div>
    </div>
  );
};
