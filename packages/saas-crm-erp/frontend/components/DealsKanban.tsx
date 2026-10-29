'use client';

import React, { useState } from 'react';
import { useRbac } from './RbacContext';
import {
  crmBackend,
  Deal,
  DealStage,
  formatCents,
  addCents,
} from '@/lib/crmBackend';
import {
  Plus,
  ArrowRight,
  ArrowLeft,
  FileText,
  CheckCircle,
  Lock,
  Calendar,
} from 'lucide-react';

interface StageConfig {
  id: DealStage;
  label: string;
  headerBg: string;
}

const STAGES: StageConfig[] = [
  { id: 'prospect', label: '1. Prospect', headerBg: 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200' },
  { id: 'qualified', label: '2. Qualified', headerBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300' },
  { id: 'proposal', label: '3. Proposal', headerBg: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300' },
  { id: 'negotiation', label: '4. Negotiation', headerBg: 'bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300' },
  { id: 'closed_won', label: '5. Closed Won', headerBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300' },
  { id: 'closed_lost', label: '6. Closed Lost', headerBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300' },
];

export const DealsKanban: React.FC = () => {
  const { can, refreshCount, currentUser } = useRbac();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const [newDealData, setNewDealData] = useState({
    customerId: '',
    title: '',
    valueDollars: '25000',
    stage: 'qualified' as DealStage,
  });

  const canReadDeals = can('deals:read');
  const deals = React.useMemo(() => {
    if (!canReadDeals) return [];
    try {
      return crmBackend.getDeals();
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canReadDeals, refreshCount]);

  const customers = React.useMemo(() => {
    try {
      return crmBackend.getCustomers();
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCount]);

  const customerMap = React.useMemo(() => {
    return new Map(customers.map((c) => [c.id, c.name]));
  }, [customers]);

  const invoices = React.useMemo(() => {
    try {
      return crmBackend.getInvoices();
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCount]);

  const invoiceDealSet = React.useMemo(() => {
    return new Set(invoices.map((inv) => inv.dealId).filter(Boolean));
  }, [invoices]);

  const handleStageMove = (dealId: string, currentStage: DealStage, direction: 'forward' | 'backward') => {
    if (!can('deals:write')) {
      alert('Permission deals:write required to move deals.');
      return;
    }
    const stageOrder: DealStage[] = ['prospect', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];
    const currentIndex = stageOrder.indexOf(currentStage);
    const nextIndex = direction === 'forward' ? currentIndex + 1 : currentIndex - 1;

    if (nextIndex >= 0 && nextIndex < stageOrder.length) {
      crmBackend.moveDealStage(dealId, stageOrder[nextIndex]);
    }
  };

  const handleGenerateInvoice = (deal: Deal) => {
    if (!can('invoices:write')) {
      alert('Permission invoices:write required to generate invoices.');
      return;
    }
    try {
      const invoice = crmBackend.convertDealToInvoice(deal.id);
      setFeedbackMsg(`✓ Draft Invoice "${invoice.invoiceNumber}" generated for ${formatCents(invoice.totalAmountCents)}!`);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealData.customerId || !newDealData.title) return;

    const valueCents = Math.round(parseFloat(newDealData.valueDollars) * 100);
    crmBackend.createDeal({
      customerId: newDealData.customerId,
      title: newDealData.title,
      valueCents,
      stage: newDealData.stage,
    });

    setNewDealData({ customerId: '', title: '', valueDollars: '25000', stage: 'qualified' });
    setIsAddOpen(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-5 mb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Deals Pipeline (Kanban)
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/50">
              F29 Automated Lifecycle
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Progress deals through sales stages. Winning a deal unlocks 1-click draft invoice generation in integer cents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {can('deals:write') ? (
            <button
              type="button"
              data-testid="add-deal-btn"
              onClick={() => setIsAddOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Deal</span>
            </button>
          ) : (
            <div
              title="Permission deals:write required"
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg flex items-center gap-1.5 cursor-not-allowed border border-slate-200 dark:border-slate-700"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>New Deal (Gated)</span>
            </div>
          )}
        </div>
      </div>

      {/* Lifecycle Feedback Banner */}
      {feedbackMsg && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-lg text-xs font-medium flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {!canReadDeals && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-lg text-xs font-medium flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Pipeline view restricted for your active role ({currentUser.role}). Invoices and financial ledger remain accessible for auditing.</span>
        </div>
      )}

      {/* 6 Kanban Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-2">
        {STAGES.map((stage) => {
          const stageDeals = deals.filter((d) => d.stage === stage.id);
          const stageTotalCents = stageDeals.reduce((sum, d) => addCents(sum, d.valueCents), 0);

          return (
            <div
              key={stage.id}
              className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 flex flex-col min-w-[220px]"
              data-testid={`kanban-col-${stage.id}`}
            >
              {/* Column Header */}
              <div className={`p-2 rounded-lg font-bold text-xs mb-3 flex items-center justify-between border ${stage.headerBg}`}>
                <span>{stage.label}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 text-[11px]">
                  {stageDeals.length}
                </span>
              </div>

              {/* Column Total */}
              <div className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 mb-2.5 px-1 flex justify-between">
                <span>Total:</span>
                <span className="text-slate-900 dark:text-slate-100">{formatCents(stageTotalCents)}</span>
              </div>

              {/* Deal Cards Container */}
              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[520px]">
                {stageDeals.map((deal) => {
                  const customerName = customerMap.get(deal.customerId) || 'Unknown Customer';
                  const hasInvoice = invoiceDealSet.has(deal.id);

                  return (
                    <div
                      key={deal.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-2xs hover:shadow-sm transition-all"
                      data-testid={`deal-card-${deal.id}`}
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {deal.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                        {customerName}
                      </div>

                      <div className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400 my-2">
                        {formatCents(deal.valueCents)}
                      </div>

                      {/* Probability & Date */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                        <span>Win Prob: {deal.probability}%</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3" />
                          {deal.expectedCloseDate}
                        </span>
                      </div>

                      {/* F29 Lifecycle Trigger on Won Deal */}
                      {deal.stage === 'closed_won' && (
                        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {hasInvoice ? (
                            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 p-1.5 rounded">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Invoice Generated</span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              data-testid={`generate-invoice-btn-${deal.id}`}
                              onClick={() => handleGenerateInvoice(deal)}
                              className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                            >
                              <FileText className="w-3 h-3" />
                              <span>⚡ Generate Invoice</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Move Stage Buttons */}
                      <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {stage.id !== 'prospect' ? (
                          <button
                            type="button"
                            onClick={() => handleStageMove(deal.id, deal.stage, 'backward')}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title="Move back"
                            aria-label={`Move deal ${deal.title} back`}
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                          </button>
                        ) : <span />}

                        {stage.id !== 'closed_lost' && (
                          <button
                            type="button"
                            onClick={() => handleStageMove(deal.id, deal.stage, 'forward')}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                            title="Advance stage"
                            aria-label={`Advance deal ${deal.title} forward`}
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {stageDeals.length === 0 && (
                  <div className="text-center py-6 text-slate-400 text-[11px] italic">
                    No deals
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Deal Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
              Add New Deal
            </h3>
            <form onSubmit={handleCreateDeal} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Customer *
                </label>
                <select
                  required
                  value={newDealData.customerId}
                  onChange={(e) => setNewDealData({ ...newDealData, customerId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="">Select customer...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.company})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Deal Title *
                </label>
                <input
                  type="text"
                  required
                  value={newDealData.title}
                  onChange={(e) => setNewDealData({ ...newDealData, title: e.target.value })}
                  placeholder="e.g. Annual Cloud Infrastructure Renewal"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Value in USD ($) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={newDealData.valueDollars}
                  onChange={(e) => setNewDealData({ ...newDealData, valueDollars: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Initial Stage
                </label>
                <select
                  value={newDealData.stage}
                  onChange={(e) => setNewDealData({ ...newDealData, stage: e.target.value as DealStage })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="prospect">1. Prospect</option>
                  <option value="qualified">2. Qualified</option>
                  <option value="proposal">3. Proposal</option>
                  <option value="negotiation">4. Negotiation</option>
                  <option value="closed_won">5. Closed Won</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700"
                >
                  Create Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
