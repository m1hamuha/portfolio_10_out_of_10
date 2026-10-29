'use client';

import React from 'react';
import { useRbac } from './RbacContext';
import { UserRole, ROLE_METADATA, ROLE_PERMISSIONS } from '@/lib/crmBackend';
import { Shield, ShieldAlert, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';

export const RbacSwitcher: React.FC = () => {
  const { currentUser, switchRole, can } = useRbac();
  const allRoles: UserRole[] = ['SuperAdmin', 'OrgAdmin', 'Manager', 'FinanceViewer', 'SalesRep'];
  const meta = ROLE_METADATA[currentUser.role];
  const grantedPermissions = ROLE_PERMISSIONS[currentUser.role];

  return (
    <div
      role="region"
      aria-label="Role-Based Access Control Switcher"
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm mb-6 transition-all"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        {/* Active Persona Details */}
        <div className="flex items-center gap-4">
          <div className="relative">
            {currentUser.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-13 h-13 rounded-full object-cover ring-2 ring-indigo-500/30"
              />
            ) : (
              <div className="w-13 h-13 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 font-bold flex items-center justify-center text-lg">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {currentUser.name}
              </h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${meta.badgeColor}`}
                data-testid="active-role-badge"
              >
                {meta.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentUser.title} · <span className="font-mono text-slate-600 dark:text-slate-300">{currentUser.email}</span>
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
              {meta.description}
            </p>
          </div>
        </div>

        {/* 5 Interactive Role Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
            Switch Role:
          </span>
          {allRoles.map((role) => {
            const isSelected = currentUser.role === role;
            const rMeta = ROLE_METADATA[role];
            return (
              <button
                key={role}
                type="button"
                data-testid={`role-btn-${role}`}
                onClick={() => switchRole(role)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {isSelected ? <UserCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5 opacity-60" />}
                <span>{rMeta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Granted Permissions & Restriction Guidance */}
      <div className="pt-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Granted Permissions ({grantedPermissions.length}):
          </span>
          {grantedPermissions.map((perm) => (
            <span
              key={perm}
              className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px] border border-slate-200/60 dark:border-slate-700/60"
            >
              {perm}
            </span>
          ))}
        </div>

        {/* Contextual Access Boundary Note */}
        {!can('customers:delete') && (
          <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200/60 dark:border-amber-900/60 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Destructive actions (customer/deal deletion) gated.</span>
          </div>
        )}
        {!can('deals:write') && (
          <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200/60 dark:border-blue-900/60 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Pipeline edit operations restricted (Auditor Mode).</span>
          </div>
        )}
      </div>
    </div>
  );
};
