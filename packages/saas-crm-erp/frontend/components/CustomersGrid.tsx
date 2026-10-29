'use client';

import React, { useState } from 'react';
import { useRbac } from './RbacContext';
import { crmBackend, Customer, CustomerStatus, formatCents } from '@/lib/crmBackend';
import { Search, Plus, Trash2, Building2, Mail, Phone, Lock } from 'lucide-react';

export const CustomersGrid: React.FC = () => {
  const { can, refreshCount } = useRbac();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: 'lead' as CustomerStatus,
  });

  // Re-read customers whenever refreshCount changes
  const customers = React.useMemo(() => {
    return crmBackend.getCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshCount]);

  const filtered = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.company.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string, name: string) => {
    if (!can('customers:delete')) {
      alert('RBAC Violation: You do not have permission to delete customers.');
      return;
    }
    if (confirm(`Are you sure you want to delete customer "${name}"?`)) {
      crmBackend.deleteCustomer(id);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    crmBackend.createCustomer(formData);
    setFormData({ name: '', company: '', email: '', phone: '', status: 'lead' });
    setIsAddOpen(false);
  };

  const statusStyles: Record<CustomerStatus, string> = {
    enterprise: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200',
    active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-200',
    lead: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200',
    churned: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200',
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden mb-6">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Customers Directory
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Enterprise customer records with deterministic LTV tracking in integer cents.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers..."
              aria-label="Search customers"
              className="pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-48"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by customer status"
            className="py-1.5 px-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="enterprise">Enterprise</option>
            <option value="active">Active</option>
            <option value="lead">Lead</option>
            <option value="churned">Churned</option>
          </select>

          {/* Add Customer Button */}
          {can('customers:write') ? (
            <button
              type="button"
              data-testid="add-customer-btn"
              onClick={() => setIsAddOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Customer</span>
            </button>
          ) : (
            <div
              title="Permission customers:write required to add records"
              className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-lg flex items-center gap-1.5 cursor-not-allowed border border-slate-200 dark:border-slate-700"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Add Customer (Gated)</span>
            </div>
          )}
        </div>
      </div>

      {/* Customers Data Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs" data-testid="customers-table">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4">Customer & Organization</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4 text-center">Deals</th>
              <th className="py-3 px-4 text-right">Lifetime Value (LTV)</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((customer) => (
              <tr
                key={customer.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                data-testid={`customer-row-${customer.id}`}
              >
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-500 opacity-80" />
                    <span>{customer.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {customer.company}
                  </div>
                </td>

                <td className="py-3.5 px-4">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full font-semibold border text-[11px] capitalize ${
                      statusStyles[customer.status]
                    }`}
                  >
                    {customer.status}
                  </span>
                </td>

                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{customer.email}</span>
                  </div>
                  {customer.phone && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{customer.phone}</span>
                    </div>
                  )}
                </td>

                <td className="py-3.5 px-4 text-center font-medium text-slate-700 dark:text-slate-300">
                  {customer.dealCount}
                </td>

                <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {formatCents(customer.ltvCents)}
                </td>

                <td className="py-3.5 px-4 text-right">
                  {can('customers:delete') ? (
                    <button
                      type="button"
                      data-testid={`delete-customer-${customer.id}`}
                      onClick={() => handleDelete(customer.id, customer.name)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-all cursor-pointer"
                      title="Delete Customer"
                      aria-label={`Delete customer ${customer.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span
                      title="Permission customers:delete required"
                      className="p-1.5 text-slate-300 dark:text-slate-700 cursor-not-allowed inline-block"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500 text-xs">
            No customers match the current filter criteria.
          </div>
        )}
      </div>

      {/* Add Customer Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
              Create New Customer
            </h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Acme Innovations"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Company / Organization *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. Acme Innovations Inc."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="billing@acme.com"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
                >
                  <option value="lead">Lead</option>
                  <option value="active">Active</option>
                  <option value="enterprise">Enterprise</option>
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
