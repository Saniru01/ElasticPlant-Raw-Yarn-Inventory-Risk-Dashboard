import React, { useMemo, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Package,
  Factory,
  Scale,
  ShoppingCart,
  TrendingDown,
  ArrowUpRight,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  Critical: '#dc2626', // Red
  'Reorder Needed': '#d97706', // Amber
  Healthy: '#16a34a', // Emerald
};

export const ExecutiveOverviewTab: React.FC = () => {
  const { dataset, metrics, setActiveTab } = useInventory();

  // Compute number of unique suppliers affected by Critical or Reorder Needed lines
  const affectedSuppliersCount = useMemo(() => {
    const suppliers = new Set(
      dataset
        .filter((d) => d.status === 'Critical' || d.status === 'Reorder Needed')
        .map((d) => d.supplier)
    );
    return suppliers.size;
  }, [dataset]);

  // Donut data for Stock Health
  const donutData = useMemo(() => {
    const total = metrics.totalLines || 1;
    return [
      {
        name: 'Critical',
        value: metrics.criticalCount,
        percent: Math.round((metrics.criticalCount / total) * 100),
        color: STATUS_COLORS.Critical,
      },
      {
        name: 'Reorder Needed',
        value: metrics.reorderCount,
        percent: Math.round((metrics.reorderCount / total) * 100),
        color: STATUS_COLORS['Reorder Needed'],
      },
      {
        name: 'Healthy',
        value: metrics.healthyCount,
        percent: Math.round((metrics.healthyCount / total) * 100),
        color: STATUS_COLORS.Healthy,
      },
    ].filter((d) => d.value > 0);
  }, [metrics]);

  // Category comparison: Balance Stock vs Monthly Consumption
  const categoryBarData = useMemo(() => {
    const map = new Map<string, { balance: number; consumption: number }>();
    ['DTY', 'SPANDEX', 'FDY', 'LATEX', 'OTHER'].forEach((cat) => {
      map.set(cat, { balance: 0, consumption: 0 });
    });

    dataset.forEach((item) => {
      const cat = item.category || 'OTHER';
      const curr = map.get(cat) || map.get('OTHER')!;
      curr.balance += item.balQty;
      curr.consumption += item.monthlyAvg;
    });

    return Array.from(map.entries())
      .map(([category, val]) => ({
        category,
        'Balance Stock (kg)': Math.round(val.balance),
        'Monthly Consumption (kg)': Math.round(val.consumption),
      }))
      .filter((d) => d['Balance Stock (kg)'] > 0 || d['Monthly Consumption (kg)'] > 0);
  }, [dataset]);

  // Line count by Sourcing Country
  const countryBarData = useMemo(() => {
    const map = new Map<string, number>();
    dataset.forEach((item) => {
      const country = item.country || 'Unknown';
      map.set(country, (map.get(country) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([country, count]) => ({ country, lines: count }))
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 8);
  }, [dataset]);

  // Priority Purchase Orders (all items needing PO)
  const allPriorityPOs = useMemo(() => {
    return [...dataset]
      .filter((d) => d.suggestedPO > 0)
      .sort((a, b) => b.suggestedPO - a.suggestedPO);
  }, [dataset]);

  const [showAllPriority, setShowAllPriority] = useState(false);
  const displayedPriorityPOs = useMemo(() => {
    return showAllPriority ? allPriorityPOs : allPriorityPOs.slice(0, 10);
  }, [allPriorityPOs, showAllPriority]);

  return (
    <div className="space-y-6 pb-12">
      {/* Hero Headline */}
      <section className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Inventory Replenishment Briefing
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              <span className="text-red-600 font-extrabold font-mono tabular-nums">
                {metrics.needPOCount}
              </span>{' '}
              of{' '}
              <span className="font-mono tabular-nums">{metrics.totalLines}</span> raw yarn
              lines need a purchase order right now
            </h1>

            <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
              Immediate procurement commitment of{' '}
              <strong className="text-slate-900 font-semibold font-mono tabular-nums">
                {metrics.totalSuggestedPO.toLocaleString()} kg
              </strong>{' '}
              is recommended across{' '}
              <strong className="text-slate-900 font-semibold font-mono tabular-nums">
                {affectedSuppliersCount} suppliers
              </strong>{' '}
              to safeguard continuous loom operation and avoid production stockouts.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => setActiveTab('operational')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors"
            >
              <span>View Replenishment Plan</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* KPI Row (6 Stat Cards) */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Material Lines */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Material Lines</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics.totalLines}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Active SKUs monitored</div>
        </div>

        {/* Suppliers */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Suppliers</span>
            <Factory className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics.totalSuppliers}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Active vendor partners</div>
        </div>

        {/* Total Balance Stock */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Total Balance</span>
            <Scale className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {metrics.totalBalance.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">Kilograms in warehouse</div>
        </div>

        {/* Critical Lines Count */}
        <div className="bg-white border border-red-200/80 rounded-xl p-4 shadow-xs bg-red-50/20">
          <div className="flex items-center justify-between text-red-600 mb-1.5">
            <span className="text-xs font-medium">Critical Lines</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600 font-mono tabular-nums">
            {metrics.criticalCount}
          </div>
          <div className="mt-1 text-[11px] text-red-700 font-medium">Net available ≤ 0 kg</div>
        </div>

        {/* Reorder Needed Count */}
        <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-700 mb-1.5">
            <span className="text-xs font-medium">Reorder Needed</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
            {metrics.reorderCount}
          </div>
          <div className="mt-1 text-[11px] text-amber-800 font-medium">Below lead time ROL</div>
        </div>

        {/* Total Suggested PO Volume */}
        <div className="bg-white border border-indigo-200/80 rounded-xl p-4 shadow-xs bg-indigo-50/20">
          <div className="flex items-center justify-between text-indigo-700 mb-1.5">
            <span className="text-xs font-medium">Suggested PO Vol</span>
            <ShoppingCart className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700 font-mono tabular-nums truncate">
            {metrics.totalSuggestedPO.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-indigo-800 font-medium">Kilograms to order</div>
        </div>
      </section>

      {/* Row 2: Charts (Donut + Category Bar) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Health Donut */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Stock Health Distribution</h2>
              <p className="text-xs text-slate-500">Current allocation risk status</p>
            </div>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {metrics.totalLines} lines
            </span>
          </div>

          <div className="h-60 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: unknown, name: unknown) => [
                    `${Number(value)} lines`,
                    String(name),
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-400 font-medium">Stock at Risk</span>
              <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                {Math.round(
                  ((metrics.criticalCount + metrics.reorderCount) / (metrics.totalLines || 1)) * 100
                )}
                %
              </span>
            </div>
          </div>

          {/* Legend with exact count & percentage */}
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-red-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                Critical
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
                {metrics.criticalCount}
              </div>
              <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                {Math.round((metrics.criticalCount / (metrics.totalLines || 1)) * 100)}%
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-amber-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                Reorder
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
                {metrics.reorderCount}
              </div>
              <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                {Math.round((metrics.reorderCount / (metrics.totalLines || 1)) * 100)}%
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                Healthy
              </div>
              <div className="font-mono text-sm font-bold text-slate-900 mt-0.5 tabular-nums">
                {metrics.healthyCount}
              </div>
              <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                {Math.round((metrics.healthyCount / (metrics.totalLines || 1)) * 100)}%
              </div>
            </div>
          </div>
        </div>

        {/* Category: Balance Stock vs Monthly Consumption */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Stock Balance vs. Monthly Consumption by Material Category
              </h2>
              <p className="text-xs text-slate-500">Warehouse physical inventory (kg) vs 30-day run rate</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickFormatter={(val) => `${Math.round(val / 1000)}k`}
                />
                <Tooltip
                  formatter={(val: unknown) => [`${Number(val).toLocaleString()} kg`]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
                />
                <Bar dataKey="Balance Stock (kg)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Monthly Consumption (kg)" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Row 3: Sourcing Country Bar + Priority Purchase Orders List */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Material line count by sourcing country */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Lines by Sourcing Country</h2>
              <p className="text-xs text-slate-500">Geographic footprint of raw yarn supply</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={countryBarData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  dataKey="country"
                  type="category"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                  width={80}
                />
                <Tooltip
                  formatter={(val: unknown) => [`${Number(val)} lines`]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="lines" fill="#0284c7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 10 Priority Purchase Orders list */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Top Priority Purchase Orders
              </h2>
              <p className="text-xs text-slate-500">
                {showAllPriority ? `All ${allPriorityPOs.length} materials` : 'Showing top 10 materials'} ranked by suggested PO volume (kg)
              </p>
            </div>
            <div className="flex items-center gap-2">
              {allPriorityPOs.length > 10 && (
                <button
                  type="button"
                  onClick={() => setShowAllPriority((prev) => !prev)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100/80 px-2.5 py-1 rounded-md"
                >
                  {showAllPriority ? 'Show Top 10 Only' : `View More (${allPriorityPOs.length - 10} more)`}
                </button>
              )}
              <button
                onClick={() => setActiveTab('operational')}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors px-2 py-1"
              >
                Go to Replenishment &rarr;
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-96 overflow-y-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">#</th>
                  <th className="py-2.5 px-3 font-semibold">Material Code / Name</th>
                  <th className="py-2.5 px-3 font-semibold">Supplier</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Net Avail (kg)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">ROL (kg)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Suggested PO</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedPriorityPOs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No purchase orders required currently. All stocks healthy!
                    </td>
                  </tr>
                ) : (
                  displayedPriorityPOs.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-400 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 truncate max-w-[200px]" title={item.material}>
                        {item.material}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-[150px]" title={item.supplier}>
                        {item.supplier}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono tabular-nums font-medium ${
                        item.netAvailable <= 0 ? 'text-red-600 font-bold' : 'text-slate-700'
                      }`}>
                        {item.netAvailable.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                        {item.rol.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-indigo-700">
                        {item.suggestedPO.toLocaleString()} kg
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                            item.status === 'Critical'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {allPriorityPOs.length > 10 && (
            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {displayedPriorityPOs.length} of {allPriorityPOs.length} priority items
              </span>
              <button
                type="button"
                onClick={() => setShowAllPriority((prev) => !prev)}
                className="font-medium text-indigo-600 hover:text-indigo-800"
              >
                {showAllPriority ? 'Collapse to Top 10' : `View More (${allPriorityPOs.length - 10} more items to scroll)`}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
