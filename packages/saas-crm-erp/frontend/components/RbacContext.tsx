'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  crmBackend,
  User,
  UserRole,
  Permission,
  KpiSummary,
} from '@/lib/crmBackend';

interface RbacContextValue {
  currentUser: User;
  users: User[];
  can: (permission: Permission) => boolean;
  switchRole: (role: UserRole) => void;
  resetDemoData: () => void;
  kpis: KpiSummary;
  refreshCount: number;
}

const RbacContext = createContext<RbacContextValue | null>(null);

export const RbacProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(crmBackend.getActiveUser());
  const [users, setUsers] = useState<User[]>(crmBackend.getUsers());
  const [kpis, setKpis] = useState<KpiSummary>(crmBackend.getKpiSummary());
  const [refreshCount, setRefreshCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = crmBackend.subscribe(() => {
      setCurrentUser(crmBackend.getActiveUser());
      setUsers(crmBackend.getUsers());
      setKpis(crmBackend.getKpiSummary());
      setRefreshCount((prev) => prev + 1);
    });
    return unsubscribe;
  }, []);

  const switchRole = (role: UserRole) => {
    crmBackend.setActiveUserRole(role);
    setCurrentUser(crmBackend.getActiveUser());
    setKpis(crmBackend.getKpiSummary());
  };

  const resetDemoData = () => {
    crmBackend.resetToDemoDefaults();
    setCurrentUser(crmBackend.getActiveUser());
    setUsers(crmBackend.getUsers());
    setKpis(crmBackend.getKpiSummary());
  };

  const can = (permission: Permission) => {
    return crmBackend.can(permission);
  };

  return (
    <RbacContext.Provider
      value={{
        currentUser,
        users,
        can,
        switchRole,
        resetDemoData,
        kpis,
        refreshCount,
      }}
    >
      {children}
    </RbacContext.Provider>
  );
};

export const useRbac = (): RbacContextValue => {
  const context = useContext(RbacContext);
  if (!context) {
    throw new Error('useRbac must be used within an RbacProvider');
  }
  return context;
};
