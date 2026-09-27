/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Header } from './components/Header';
import { TabNav } from './components/TabNav';
import { EmptyState } from './components/EmptyState';
import { ExecutiveOverviewTab } from './components/tabs/ExecutiveOverviewTab';
import { OperationalTab } from './components/tabs/OperationalTab';
import { SupplierRiskTab } from './components/tabs/SupplierRiskTab';
import { CategoryInsightsTab } from './components/tabs/CategoryInsightsTab';
import { MasterLogTab } from './components/tabs/MasterLogTab';
import { MethodologyModal } from './components/MethodologyModal';
import { ShieldCheck, HelpCircle, FileSpreadsheet } from 'lucide-react';

const DashboardContent: React.FC = () => {
  const { dataset, activeTab } = useInventory();
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Application Bar */}
      <Header />

      {/* 5-Tab Navigation Bar */}
      <TabNav />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {dataset.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {activeTab === 'executive' && <ExecutiveOverviewTab />}
            {activeTab === 'operational' && <OperationalTab />}
            {activeTab === 'supplier' && <SupplierRiskTab />}
            {activeTab === 'category' && <CategoryInsightsTab />}
            {activeTab === 'master' && <MasterLogTab />}
          </>
        )}
      </main>

      {/* Subtle Corporate Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Apex Elastic Industries</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Raw Yarn Supply Chain & Risk Intelligence</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              100% Client-Side In-Browser Processing (Zero Server Transmission)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMethodologyOpen(true)}
              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Calculation Methodology</span>
            </button>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-mono text-[11px] text-slate-400">ISO 9001:2015 Compliant</span>
          </div>
        </div>
      </footer>

      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <InventoryProvider>
      <DashboardContent />
    </InventoryProvider>
  );
}
