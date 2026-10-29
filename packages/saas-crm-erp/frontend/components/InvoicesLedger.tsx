'use client';

import React, { useState } from 'react';
import { useRbac } from './RbacContext';
import {
  crmBackend,
  Invoice,
  InvoiceStatus,
  formatCents,
} from '@/lib/crmBackend';
import {
  CreditCard,
  Download,
  FileSpreadsheet,
  CheckCircle,
  Clock,
  AlertCircle,
  Lock,
} from 'lucide-react';

export const InvoicesLedger: React.FC = () => {
  const { can, refreshCount } = useRbac();
  const [feedback, setFeedback] = useState<string | null>(null);

  const invoices = React.useMemo(() => {
    return crmBackend.getInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCount]);

  const customers = React.useMemo(() => {
    return crmBackend.getCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCount]);

  const customerMap = React.useMemo(() => {
    return new Map(customers.map((c) => [c.id, c]));
  }, [customers]);

  const handlePay = (invoice: Invoice) => {
    if (!can('payments:record')) {
      alert('Permission payments:record required to record payments.');
      return;
    }
    try {
      const { updatedInvoice, payment } = crmBackend.payInvoice(invoice.id);
      const cust = customerMap.get(invoice.customerId);
      const newLtv = cust ? formatCents(cust.ltvCents) : '$0.00';

      setFeedback(
        `✓ Payment of ${formatCents(payment.amountCents)} recorded for ${updatedInvoice.invoiceNumber}! Customer LTV updated to ${newLtv}.`
      );
      setTimeout(() => setFeedback(null), 6000);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleExportCsv = () => {
    if (!can('finance:export')) {
      alert('Permission finance:export required to export ledger.');
      return;
    }
    const csvContent = crmBackend.exportLedgerCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `saas-crm-erp-ledger-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusBadges: Record<InvoiceStatus, { label: string; style: string }> = {
    draft: { label: 'Draft', style: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300' },
    sent: { label: 'Sent', style: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200' },
    paid: { label: 'Paid', style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200' },
    overdue: { label: 'Overdue', style: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200' },
    cancelled: { label: 'Cancelled', style: 'bg-slate-100 text-slate-500 border-slate-200' },
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden mb-6">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Invoices & Financial Operations Ledger
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/50">
              Integer-Cent Cents Math
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Operational billing ledger. Recording payments marks invoices paid and accumulates verified customer LTV.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {can('finance:export') ? (
            <button
              type="button"
              data-testid="export-ledger-csv-btn"
              onClick={handleExportCsv}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          ) : (
            <div
              title="Permission finance:export required"
              className="px-3.5 py-1.5 text-xs font-medium bg-slate-50 dark:bg-slate-800/40 text-slate-400 rounded-lg flex items-center gap-1.5 cursor-not-allowed border border-slate-200/50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Export CSV (Gated)</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Action Feedback Banner */}
      {feedback && (
        <div className="mx-5 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Invoices Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs" data-testid="invoices-table">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Issue Date</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4 text-right">Amount (Cents)</th>
              <th className="py-3 px-4 text-right">Payment Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {invoices.map((inv) => {
              const cust = customerMap.get(inv.customerId);
              const badge = statusBadges[inv.status];

              return (
                <tr
                  key={inv.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  data-testid={`invoice-row-${inv.id}`}
                >
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{inv.invoiceNumber}</span>
                    </div>
                    {inv.dealId && (
                      <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                        Won Deal Linked
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">
                      {cust?.name || 'Customer'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Current LTV: {cust ? formatCents(cust.ltvCents) : '$0.00'}
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-semibold border text-[11px] ${badge.style}`}
                    >
                      {badge.label}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                    {inv.issuedDate}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 text-[11px]">
                    {inv.dueDate}
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {can('finance:view_ledger') ? formatCents(inv.totalAmountCents) : '••••••••'}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    {inv.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Settled</span>
                      </span>
                    ) : can('payments:record') ? (
                      <button
                        type="button"
                        data-testid={`pay-invoice-btn-${inv.id}`}
                        onClick={() => handlePay(inv)}
                        className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Record Payment</span>
                      </button>
                    ) : (
                      <span
                        title="Permission payments:record required"
                        className="text-[11px] text-slate-400 inline-flex items-center gap-1 cursor-not-allowed"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Payment (Gated)</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
