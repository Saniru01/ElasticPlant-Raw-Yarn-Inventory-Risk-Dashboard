import React, { useMemo, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { SupplierScorecard } from '../../types/inventory';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import {
  ShieldAlert,
  Globe2,
  Clock,
  ArrowUpDown,
  Building2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

export const SupplierRiskTab: React.FC = () => {
  const { dataset, supplierScorecards, supplierFilters, setSupplierFilters } = useInventory();
  const { search, sortBy, sortOrder } = supplierFilters;

  // Total monthly consumption across all suppliers
  const totalConsumption = useMemo(() => {
    return dataset.reduce((acc, curr) => acc + curr.monthlyAvg, 0) || 1;
  }, [dataset]);

  // Supplier Concentration Data: % share of monthly consumption (Top 10 + Other)
  const supplierConcentrationData = useMemo(() => {
    const sorted = [...supplierScorecards].sort((a, b) => b.totalMonthlyCons - a.totalMonthlyCons);
    const top10 = sorted.slice(0, 10);
    const rest = sorted.slice(10);

    const data = top10.map((s) => ({
      name: s.supplier.length > 20 ? `${s.supplier.slice(0, 18)}...` : s.supplier,
      fullName: s.supplier,
      share: Math.round((s.totalMonthlyCons / totalConsumption) * 1000) / 10,
      volume: s.totalMonthlyCons,
    }));

    if (rest.length > 0) {
      const restVolume = rest.reduce((acc, curr) => acc + curr.totalMonthlyCons, 0);
      data.push({
        name: 'Other Suppliers',
        fullName: `${rest.length} other suppliers`,
        share: Math.round((restVolume / totalConsumption) * 1000) / 10,
        volume: restVolume,
      });
    }

    return data;
  }, [supplierScorecards, totalConsumption]);

  // Geographic Concentration Data: % share of monthly consumption by Country
  const countryConcentrationData = useMemo(() => {
    const map = new Map<string, number>();
    dataset.forEach((item) => {
      const country = item.country || 'Unknown';
      map.set(country, (map.get(country) || 0) + item.monthlyAvg);
    });

    return Array.from(map.entries())
      .map(([country, vol]) => ({
        country,
        share: Math.round((vol / totalConsumption) * 1000) / 10,
        volume: vol,
      }))
      .sort((a, b) => b.share - a.share);
  }, [dataset, totalConsumption]);

  // Average Total LT (days) by Country
  const leadTimeByCountryData = useMemo(() => {
    const map = new Map<string, { totalLT: number; count: number }>();
    dataset.forEach((item) => {
      const country = item.country || 'Unknown';
      if (!map.has(country)) {
        map.set(country, { totalLT: 0, count: 0 });
      }
      const record = map.get(country)!;
      record.totalLT += item.totalLT;
      record.count += 1;
    });

    return Array.from(map.entries())
      .map(([country, stats]) => ({
        country,
        avgLT: Math.round((stats.totalLT / stats.count) * 10) / 10,
        count: stats.count,
      }))
      .sort((a, b) => b.avgLT - a.avgLT);
  }, [dataset]);

  // Scorecard top 10 limit with View More
  const [scorecardLimit, setScorecardLimit] = useState<number>(10);

  // Filter & sort Supplier Scorecards
  const sortedScorecards = useMemo(() => {
    let list = [...supplierScorecards];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => s.supplier.toLowerCase().includes(q));
    }

    return list.sort((a, b) => {
      let aVal = a[sortBy as keyof SupplierScorecard];
      let bVal = b[sortBy as keyof SupplierScorecard];

      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }

      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [supplierScorecards, search, sortBy, sortOrder]);

  const displayedScorecards = useMemo(() => {
    return sortedScorecards.slice(0, scorecardLimit);
  }, [sortedScorecards, scorecardLimit]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSupplierFilters((prev) => ({
        ...prev,
        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
      }));
    } else {
      setSupplierFilters((prev) => ({
        ...prev,
        sortBy: field,
        sortOrder: 'desc',
      }));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Strategy Briefing Header */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-lg">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Procurement & Sourcing Risk Assessment
            </h2>
            <p className="text-xs text-slate-500">
              Vendor dependency, geographical concentration risk, and structural lead-time disparities
            </p>
          </div>
        </div>
      </div>

      {/* Row 1: Charts (Supplier Concentration & Country Concentration) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supplier Concentration Chart */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Supplier Dependency Concentration</h3>
              <p className="text-xs text-slate-500">% share of total plant monthly yarn consumption</p>
            </div>
            <span className="text-xs font-mono text-slate-400 tabular-nums">Top 10 Vendors</span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={supplierConcentrationData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  unit="%"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#475569', fontSize: 11 }}
                  width={110}
                />
                <Tooltip
                  formatter={(val: unknown, name: unknown, item: unknown) => [
                    `${Number(val)}% (${Number(
                      (item as { payload: { volume: number } }).payload.volume
                    ).toLocaleString()} kg/mo)`,
                    'Share',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="share" fill="#4f46e5" radius={[0, 4, 4, 0]}>
                  {supplierConcentrationData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.share >= 25 ? '#dc2626' : entry.share >= 15 ? '#d97706' : '#4f46e5'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 text-right">
            Red = &ge;25% single vendor risk · Amber = &ge;15% moderate concentration
          </div>
        </div>

        {/* Geographic Origin Concentration */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Geographic Sourcing Footprint</h3>
              <p className="text-xs text-slate-500">% share of monthly consumption by origin country</p>
            </div>
            <Globe2 className="w-4 h-4 text-slate-400" />
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={countryConcentrationData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  unit="%"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                />
                <YAxis
                  dataKey="country"
                  type="category"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 500 }}
                  width={85}
                />
                <Tooltip
                  formatter={(val: unknown, name: unknown, item: unknown) => [
                    `${Number(val)}% (${Number(
                      (item as { payload: { volume: number } }).payload.volume
                    ).toLocaleString()} kg/mo)`,
                    'Share',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="share" fill="#0284c7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Structural Lead Times by Country */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Average Total Lead Time by Country of Origin (Days)
              </h3>
              <p className="text-xs text-slate-500">
                Surfaces structural transit, production, and clearance duration differences across sourcing regions
              </p>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={leadTimeByCountryData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="country"
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
                unit="d"
              />
              <Tooltip
                formatter={(val: unknown) => [`${Number(val)} days average lead time`]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="avgLT" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Supplier Scorecard Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Supplier Risk & Performance Scorecard
            </h3>
            <p className="text-xs text-slate-500">
              {scorecardLimit < sortedScorecards.length
                ? `Showing top ${displayedScorecards.length} of ${sortedScorecards.length} vendors (scroll down to view loaded rows)`
                : `Showing all ${sortedScorecards.length} vendor scorecards`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-full sm:w-56">
              <input
                type="text"
                placeholder="Search supplier..."
                value={search}
                onChange={(e) => setSupplierFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {sortedScorecards.length > 10 && (
              <button
                type="button"
                onClick={() =>
                  setScorecardLimit((prev) =>
                    prev >= sortedScorecards.length ? 10 : Math.min(sortedScorecards.length, prev + 10)
                  )
                }
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                {scorecardLimit >= sortedScorecards.length ? 'Show Top 10' : `View More (+${sortedScorecards.length - scorecardLimit})`}
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 z-10 text-slate-600 font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th
                  onClick={() => handleSort('supplier')}
                  className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Supplier Name</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('materialCount')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Materials</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalBalance')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Total Bal (kg)</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalMonthlyCons')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Monthly Cons (kg)</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('criticalCount')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200/60 transition-colors bg-red-50/40"
                >
                  <div className="flex items-center justify-center gap-1 text-red-700 font-bold">
                    <span>Critical</span>
                    <ArrowUpDown className="w-3 h-3 text-red-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('reorderCount')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200/60 transition-colors bg-amber-50/40"
                >
                  <div className="flex items-center justify-center gap-1 text-amber-800">
                    <span>Reorder</span>
                    <ArrowUpDown className="w-3 h-3 text-amber-500" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('healthyCount')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1 text-emerald-800">
                    <span>Healthy</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('avgTotalLT')}
                  className="py-3 px-3 text-center cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Avg Total LT</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('suggestedPOQty')}
                  className="py-3 px-4 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5 text-indigo-900 font-bold">
                    <span>Total Suggested PO</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedScorecards.map((s) => (
                <tr
                  key={s.supplier}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    s.criticalCount > 0 ? 'bg-red-50/15' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{s.supplier}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-600">
                    {s.materialCount}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-800">
                    {s.totalBalance.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600">
                    {s.totalMonthlyCons.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums font-bold">
                    {s.criticalCount > 0 ? (
                      <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                        {s.criticalCount}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums">
                    {s.reorderCount > 0 ? (
                      <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md font-semibold">
                        {s.reorderCount}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums text-emerald-700">
                    {s.healthyCount}
                  </td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-700">
                    {s.avgTotalLT}d
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-indigo-700">
                    {s.suggestedPOQty > 0 ? `${s.suggestedPOQty.toLocaleString()} kg` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sortedScorecards.length > 10 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {displayedScorecards.length} of {sortedScorecards.length} suppliers (scroll list above)
            </span>
            <button
              type="button"
              onClick={() =>
                setScorecardLimit((prev) =>
                  prev >= sortedScorecards.length ? 10 : sortedScorecards.length
                )
              }
              className="font-medium text-indigo-600 hover:text-indigo-800"
            >
              {scorecardLimit >= sortedScorecards.length ? 'Collapse to Top 10' : `Show All (${sortedScorecards.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
