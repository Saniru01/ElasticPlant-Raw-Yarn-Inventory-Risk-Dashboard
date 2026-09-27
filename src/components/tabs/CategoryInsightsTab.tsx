import React, { useMemo, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { YarnItem, YarnCategory } from '../../types/inventory';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Layers,
  Sparkles,
  Search,
  Filter,
  ArrowRight,
  Shuffle,
  ShieldCheck,
  AlertCircle,
  Building,
} from 'lucide-react';

export const CategoryInsightsTab: React.FC = () => {
  const {
    dataset,
    categorySummaries,
    substituteGroups,
    categoryFilters,
    setCategoryFilters,
  } = useInventory();

  const [activeSubView, setActiveSubView] = useState<'attributes' | 'substitutes'>('attributes');

  const { category, denier, filament, color, search } = categoryFilters;

  // Unique options for filters
  const denierOptions = useMemo(() => {
    const set = new Set<string>();
    dataset.forEach((d) => {
      if (d.attributes.denier && d.attributes.denier !== '-') {
        set.add(d.attributes.denier);
      }
    });
    return Array.from(set).sort();
  }, [dataset]);

  const filamentOptions = useMemo(() => {
    const set = new Set<string>();
    dataset.forEach((d) => {
      if (d.attributes.filament && d.attributes.filament !== '-') {
        set.add(d.attributes.filament);
      }
    });
    return Array.from(set).sort();
  }, [dataset]);

  const colorOptions = useMemo(() => {
    const set = new Set<string>();
    dataset.forEach((d) => {
      if (d.attributes.color && d.attributes.color !== '-') {
        set.add(d.attributes.color);
      }
    });
    return Array.from(set).sort();
  }, [dataset]);

  // Limits for top 10 with View More
  const [attributeLimit, setAttributeLimit] = useState<number>(10);
  const [substitutesLimit, setSubstitutesLimit] = useState<number>(10);

  // Reset limits when filters change
  React.useEffect(() => {
    setAttributeLimit(10);
    setSubstitutesLimit(10);
  }, [category, denier, filament, color, search]);

  // Stacked Bar Data: Status Breakdown by Category
  const categoryStackedBarData = useMemo(() => {
    return categorySummaries.map((cat) => ({
      category: cat.category,
      Critical: cat.criticalCount,
      'Reorder Needed': cat.reorderCount,
      Healthy: cat.healthyCount,
      totalLines: cat.materialCount,
    }));
  }, [categorySummaries]);

  // Filtered materials for attribute table
  const filteredMaterials = useMemo(() => {
    return dataset.filter((item) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          item.material.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.supplier.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (category !== 'ALL' && item.category !== category) return false;
      if (denier !== 'ALL' && item.attributes.denier !== denier) return false;
      if (filament !== 'ALL' && item.attributes.filament !== filament) return false;
      if (color !== 'ALL' && item.attributes.color !== color) return false;
      return true;
    });
  }, [dataset, search, category, denier, filament, color]);

  const displayedMaterials = useMemo(() => {
    return filteredMaterials.slice(0, attributeLimit);
  }, [filteredMaterials, attributeLimit]);

  // Filtered substitute groups
  const filteredSubstitutes = useMemo(() => {
    if (category === 'ALL') return substituteGroups;
    return substituteGroups.filter((g) => g.category === category);
  }, [substituteGroups, category]);

  const displayedSubstitutes = useMemo(() => {
    return filteredSubstitutes.slice(0, substitutesLimit);
  }, [filteredSubstitutes, substitutesLimit]);

  return (
    <div className="space-y-6 pb-12">
      {/* Category Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categorySummaries.map((cat) => {
          const isCriticalHeavy = cat.criticalCount > 0;
          return (
            <div
              key={cat.category}
              className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
                category === cat.category
                  ? 'border-indigo-600 ring-2 ring-indigo-500/20'
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono">
                  {cat.category} YARNS
                </span>
                <span className="text-xs font-mono text-slate-400 tabular-nums">
                  {cat.materialCount} lines
                </span>
              </div>

              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Balance Stock:</span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {cat.totalBalance.toLocaleString()} kg
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Monthly Run Rate:</span>
                  <span className="font-mono text-slate-700 tabular-nums">
                    {cat.totalMonthlyCons.toLocaleString()} kg/mo
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Critical Lines:</span>
                  <span
                    className={`font-mono font-bold tabular-nums ${
                      isCriticalHeavy ? 'text-red-600' : 'text-slate-400'
                    }`}
                  >
                    {cat.criticalCount} {isCriticalHeavy && 'lines'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Suggested PO:</span>
                  <span className="font-mono font-bold text-indigo-700 tabular-nums">
                    {cat.totalSuggestedPO > 0 ? `${cat.totalSuggestedPO.toLocaleString()} kg` : '—'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Stacked Bar Chart: Status Breakdown by Category */}
      <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Inventory Health Status Distribution by Yarn Category
            </h3>
            <p className="text-xs text-slate-500">
              Highlights disproportionate stockout risks across fiber types (e.g. bare spandex vs polyester DTY)
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={categoryStackedBarData}
              margin={{ top: 10, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="category"
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
              />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <Tooltip
                formatter={(val: unknown, name: unknown) => [`${Number(val)} lines`, String(name)]}
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
              <Bar dataKey="Critical" stackId="status" fill="#dc2626" />
              <Bar dataKey="Reorder Needed" stackId="status" fill="#d97706" />
              <Bar dataKey="Healthy" stackId="status" fill="#16a34a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Sub-View Switcher: Attribute Catalog vs Substitutes View */}
      <section className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Technical Specifications & Continuity Analysis
            </h3>
            <p className="text-xs text-slate-500">
              Parsed filament metrics, denier specifications, and multi-vendor substitute matching
            </p>
          </div>

          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs self-start sm:self-auto">
            <button
              onClick={() => setActiveSubView('attributes')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeSubView === 'attributes'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Parsed Attributes Catalog
            </button>
            <button
              onClick={() => setActiveSubView('substitutes')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeSubView === 'substitutes'
                  ? 'bg-white text-indigo-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Possible Substitutes Matrix ({substituteGroups.length})
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search specs or material..."
              value={search}
              onChange={(e) => setCategoryFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-600"
            />
          </div>

          <select
            value={category}
            onChange={(e) => setCategoryFilters((prev) => ({ ...prev, category: e.target.value }))}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5"
          >
            <option value="ALL">All Categories</option>
            {categorySummaries.map((c) => (
              <option key={c.category} value={c.category}>
                {c.category}
              </option>
            ))}
          </select>

          <select
            value={denier}
            onChange={(e) => setCategoryFilters((prev) => ({ ...prev, denier: e.target.value }))}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5"
          >
            <option value="ALL">All Deniers</option>
            {denierOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={filament}
            onChange={(e) => setCategoryFilters((prev) => ({ ...prev, filament: e.target.value }))}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5"
          >
            <option value="ALL">All Filaments</option>
            {filamentOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          <select
            value={color}
            onChange={(e) => setCategoryFilters((prev) => ({ ...prev, color: e.target.value }))}
            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5"
          >
            <option value="ALL">All Colors/Lusters</option>
            {colorOptions.map((col) => (
              <option key={col} value={col}>
                {col}
              </option>
            ))}
          </select>

          {(search || category !== 'ALL' || denier !== 'ALL' || filament !== 'ALL' || color !== 'ALL') && (
            <button
              onClick={() =>
                setCategoryFilters({
                  category: 'ALL',
                  denier: 'ALL',
                  filament: 'ALL',
                  color: 'ALL',
                  search: '',
                })
              }
              className="text-xs font-semibold text-slate-500 hover:text-indigo-600 px-2 py-1"
            >
              Reset
            </button>
          )}
        </div>

        {/* View 1: Material Attributes Catalog */}
        {activeSubView === 'attributes' && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 z-10 text-slate-600 font-semibold border-b border-slate-200 shadow-xs">
                  <tr>
                    <th className="py-2.5 px-3">Material String</th>
                    <th className="py-2.5 px-2.5">Category</th>
                    <th className="py-2.5 px-2.5">Denier / Count</th>
                    <th className="py-2.5 px-2.5">Filament</th>
                    <th className="py-2.5 px-2.5">Twist / Luster</th>
                    <th className="py-2.5 px-2.5">Color</th>
                    <th className="py-2.5 px-3">Country of Origin</th>
                    <th className="py-2.5 px-3">Supplier</th>
                    <th className="py-2.5 px-3 text-right">Bal Qty (kg)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedMaterials.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 max-w-[200px] truncate" title={item.material}>
                        {item.material}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono text-slate-700">
                        {item.category}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono font-semibold text-indigo-700">
                        {item.attributes.denier}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono text-slate-700">
                        {item.attributes.filament}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono text-slate-600">
                        {item.attributes.twistOrLuster}
                      </td>
                      <td className="py-2.5 px-2.5 font-mono text-slate-600">
                        {item.attributes.color}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {item.country} <span className="text-[10px] text-slate-400 font-mono">({item.countryCode})</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[130px] truncate" title={item.supplier}>
                        {item.supplier}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-900 font-medium">
                        {item.balQty.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-md ${
                            item.status === 'Critical'
                              ? 'bg-red-100 text-red-800'
                              : item.status === 'Reorder Needed'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredMaterials.length > 10 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {displayedMaterials.length} of {filteredMaterials.length} items (scroll list above)
                </span>
                <div className="flex items-center gap-2">
                  {attributeLimit < filteredMaterials.length ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setAttributeLimit((prev) => Math.min(filteredMaterials.length, prev + 10))
                        }
                        className="font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        View More (+10 to scroll)
                      </button>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() => setAttributeLimit(filteredMaterials.length)}
                        className="font-medium text-slate-600 hover:text-slate-900"
                      >
                        Show All ({filteredMaterials.length})
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAttributeLimit(10)}
                      className="font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Collapse to Top 10
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* View 2: Possible Substitutes View */}
        {activeSubView === 'substitutes' && (
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-lg text-xs text-indigo-900 leading-relaxed flex items-start gap-2">
              <Shuffle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-indigo-950">Supply Continuity Cross-Referencing: </span>
                Groups below share identical category and fiber specifications (denier & filament count) but are sourced from multiple suppliers. In the event of a vendor stockout or shipping delay, these alternative yarn codes can be re-routed on plant elastic looms.
              </div>
            </div>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {displayedSubstitutes.map((group) => {
                const isMultiSourced = group.suppliers.length > 1;
                return (
                  <div
                    key={group.groupKey}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-mono font-bold text-xs rounded">
                          {group.category}
                        </span>
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {group.spec}
                        </span>
                        {isMultiSourced ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Multi-Sourced ({group.suppliers.length} vendors)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Single Vendor Dependent
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>
                          Combined Balance:{' '}
                          <strong className="text-slate-900 font-mono font-semibold">
                            {group.totalBalance.toLocaleString()} kg
                          </strong>
                        </span>
                        <span>·</span>
                        <span>
                          Lead Time Range:{' '}
                          <strong className="text-slate-900 font-mono font-semibold">
                            {group.minLT === group.maxLT
                              ? `${group.minLT}d`
                              : `${group.minLT}d – ${group.maxLT}d`}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Member Materials Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {group.items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white border border-slate-200 rounded-lg p-3 text-xs flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-semibold text-slate-900 truncate max-w-[150px]" title={item.material}>
                                {item.material}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                  item.status === 'Critical'
                                    ? 'bg-red-100 text-red-800'
                                    : item.status === 'Reorder Needed'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mb-2">
                              <Building className="w-3 h-3 text-slate-400" />
                              <span className="truncate" title={item.supplier}>{item.supplier}</span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Bal: <strong className="font-mono text-slate-800">{item.balQty.toLocaleString()} kg</strong></span>
                            <span>Total LT: <strong className="font-mono text-slate-800">{item.totalLT}d</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredSubstitutes.length > 10 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {displayedSubstitutes.length} of {filteredSubstitutes.length} substitute groups (scroll list above)
                </span>
                <div className="flex items-center gap-2">
                  {substitutesLimit < filteredSubstitutes.length ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setSubstitutesLimit((prev) =>
                            Math.min(filteredSubstitutes.length, prev + 10)
                          )
                        }
                        className="font-medium text-indigo-600 hover:text-indigo-800"
                      >
                        View More (+10 to scroll)
                      </button>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <button
                        type="button"
                        onClick={() => setSubstitutesLimit(filteredSubstitutes.length)}
                        className="font-medium text-slate-600 hover:text-slate-900"
                      >
                        Show All ({filteredSubstitutes.length})
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSubstitutesLimit(10)}
                      className="font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      Collapse to Top 10
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
