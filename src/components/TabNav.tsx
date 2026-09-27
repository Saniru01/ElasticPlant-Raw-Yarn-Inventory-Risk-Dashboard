import React from 'react';
import { useInventory, TabId } from '../context/InventoryContext';
import { 
  BarChart3, 
  ShoppingCart, 
  ShieldAlert, 
  Layers, 
  Database 
} from 'lucide-react';

interface TabItem {
  id: TabId;
  index: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const TabNav: React.FC = () => {
  const { activeTab, setActiveTab, metrics } = useInventory();

  const tabs: TabItem[] = [
    {
      id: 'executive',
      index: '01',
      name: 'Executive Overview',
      icon: BarChart3,
    },
    {
      id: 'operational',
      index: '02',
      name: 'Operational Replenishment',
      icon: ShoppingCart,
      badge: metrics.needPOCount > 0 ? metrics.needPOCount : undefined,
    },
    {
      id: 'supplier',
      index: '03',
      name: 'Supplier & Sourcing Risk',
      icon: ShieldAlert,
    },
    {
      id: 'category',
      index: '04',
      name: 'Material & Category Insights',
      icon: Layers,
    },
    {
      id: 'master',
      index: '05',
      name: 'Master Log',
      icon: Database,
      badge: metrics.totalLines > 0 ? metrics.totalLines : undefined,
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar" aria-label="Dashboard Views">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-3.5 px-3 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors relative ${
                  isActive
                    ? 'border-indigo-600 text-indigo-700 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <span className={`font-mono text-xs mr-2 transition-colors ${
                  isActive ? 'text-indigo-600 font-bold' : 'text-slate-400 group-hover:text-slate-600'
                }`}>
                  {tab.index}
                </span>

                <Icon className={`w-4 h-4 mr-2 shrink-0 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'
                }`} />

                <span>{tab.name}</span>

                {tab.badge !== undefined && (
                  <span
                    className={`ml-2 px-1.5 py-0.5 text-[10px] font-mono tabular-nums font-semibold rounded-md ${
                      tab.id === 'operational'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
