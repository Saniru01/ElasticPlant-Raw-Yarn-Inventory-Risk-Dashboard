import React, { useMemo, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { YarnItem, YarnStatus } from '../../types/inventory';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  Clock,
  AlertTriangle,
  ShoppingCart,
  Download,
  CheckCircle,
  Building2,
  Calendar,
} from 'lucide-react';

export const OperationalTab: React.FC = () => {
  const { dataset, operationalFilters, setOperationalFilters } = useInventory();
  const [collapsedSuppliers, setCollapsedSuppliers] = useState<Record<string, boolean>>({});

  const { search, supplier, category, status, sortBy, sortOrder } = operationalFilters;

  // Unique suppliers & categories for dropdown filters
  const supplierOptions = useMemo(() => {
    return Array.from(new Set(dataset.map((d) => d.supplier).filter(Boolean))).sort();
  }, [dataset]);

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(dataset.map((d) => d.category).filter(Boolean))).sort();
  }, [dataset]);

  // Compute Order By Date helper
  const getOrderByInfo = (item: YarnItem) => {
    if (item.daysCover === null || item.dailyCons <= 0) {
      return { label: 'No Run Rate', isUrgent: false, dateStr: '—' };
    }

    if (item.netAvailable <= 0) {
      return { label: 'Order Now (Immediate)', isUrgent: true, dateStr: 'Stockout Risk' };
    }

    // Days until we must order = daysCover - totalLT
    const bufferDays = item.daysCover - item.totalLT;
    if (bufferDays <= 0) {
      return {
        label: 'Order Now',
        isUrgent: true,
        dateStr: `Lead time exceeded (${Math.round(Math.abs(bufferDays))}d deficit)`,
      };
    }

    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + Math.round(bufferDays));
    const formatted = targetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return {
      label: formatted,
      isUrgent: bufferDays <= 7,
      dateStr: `In ${Math.round(bufferDays)} days`,
    };
  };

  // Filter & sort data
  const filteredData = useMemo(() => {
    return dataset.filter((item) => {
      // Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const match =
          item.material.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.supplier.toLowerCase().includes(q);
        if (!match) return false;
      }
      // Supplier filter
      if (supplier !== 'ALL' && item.supplier !== supplier) {
        return false;
      }
      // Category filter
      if (category !== 'ALL' && item.category !== category) {
        return false;
      }
      // Status filter
      if (status !== 'ALL' && item.status !== status) {
        return false;
      }
      return true;
    });
  }, [dataset, search, supplier, category, status]);

  // Sorted data
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let aVal = a[sortBy as keyof YarnItem];
      let bVal = b[sortBy as keyof YarnItem];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string') {
        return sortOrder === 'asc'
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string);
      }

      return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [filteredData, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setOperationalFilters((prev) => ({
        ...prev,
        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
      }));
    } else {
      setOperationalFilters((prev) => ({
        ...prev,
        sortBy: field,
        sortOrder: 'desc',
      }));
    }
  };

  // States for top 10 limit with View More options
  const [tableLimit, setTableLimit] = useState<number>(10);
  const [supplierLimit, setSupplierLimit] = useState<number>(10);
  const [urgencyLimit, setUrgencyLimit] = useState<number>(10);
  const [expandedSupplierItems, setExpandedSupplierItems] = useState<Record<string, boolean>>({});

  // Reset table limit when filters change
  React.useEffect(() => {
    setTableLimit(10);
  }, [search, supplier, category, status, sortBy, sortOrder]);

  // "Suggested POs grouped by supplier" panel
  const supplierPOGroups = useMemo(() => {
    const map = new Map<string, { items: YarnItem[]; totalPOQty: number }>();
    dataset.forEach((item) => {
      if (item.suggestedPO > 0) {
        if (!map.has(item.supplier)) {
          map.set(item.supplier, { items: [], totalPOQty: 0 });
        }
        const group = map.get(item.supplier)!;
        group.items.push(item);
        group.totalPOQty += item.suggestedPO;
      }
    });

    return Array.from(map.entries())
      .map(([supplierName, data]) => ({
        supplier: supplierName,
        items: data.items.sort((a, b) => b.suggestedPO - a.suggestedPO),
        totalPOQty: Math.round(data.totalPOQty),
      }))
      .sort((a, b) => b.totalPOQty - a.totalPOQty);
  }, [dataset]);

  const displayedSupplierGroups = useMemo(() => {
    return supplierPOGroups.slice(0, supplierLimit);
  }, [supplierPOGroups, supplierLimit]);

  const toggleSupplierCollapse = (sup: string) => {
    setCollapsedSuppliers((prev) => ({
      ...prev,
      [sup]: !prev[sup],
    }));
  };

  const toggleSupplierItemsExpand = (sup: string) => {
    setExpandedSupplierItems((prev) => ({
      ...prev,
      [sup]: !prev[sup],
    }));
  };

  // Days-of-cover ranked list (most urgent first)
  const allUrgentItems = useMemo(() => {
    return [...dataset]
      .filter((d) => d.daysCover !== null)
      .sort((a, b) => (a.daysCover || 0) - (b.daysCover || 0));
  }, [dataset]);

  const displayedUrgentItems = useMemo(() => {
    return allUrgentItems.slice(0, urgencyLimit);
  }, [allUrgentItems, urgencyLimit]);

  const displayedRows = useMemo(() => {
    return sortedData.slice(0, tableLimit);
  }, [sortedData, tableLimit]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Controls: Search & Filters */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by material name, code, or supplier..."
              value={search}
              onChange={(e) => setOperationalFilters((prev) => ({ ...prev, search: e.target.value }))}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Supplier Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Supplier:</span>
              <select
                value={supplier}
                onChange={(e) => setOperationalFilters((prev) => ({ ...prev, supplier: e.target.value }))}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-600"
              >
                <option value="ALL">All Suppliers ({supplierOptions.length})</option>
                {supplierOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Category:</span>
              <select
                value={category}
                onChange={(e) => setOperationalFilters((prev) => ({ ...prev, category: e.target.value }))}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-600"
              >
                <option value="ALL">All Categories</option>
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={status}
                onChange={(e) => setOperationalFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:border-indigo-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="Critical">Critical Only</option>
                <option value="Reorder Needed">Reorder Needed</option>
                <option value="Healthy">Healthy</option>
              </select>
            </div>

            {(search || supplier !== 'ALL' || category !== 'ALL' || status !== 'ALL') && (
              <button
                onClick={() =>
                  setOperationalFilters((prev) => ({
                    ...prev,
                    search: '',
                    supplier: 'ALL',
                    category: 'ALL',
                    status: 'ALL',
                  }))
                }
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 px-2 py-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Full Data Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Replenishment & Lead Time Schedule
            </h2>
            <p className="text-xs text-slate-500">
              {tableLimit < sortedData.length
                ? `Showing top ${displayedRows.length} of ${sortedData.length} items (scroll down to view loaded rows)`
                : `Showing all ${sortedData.length} items`}
            </p>
          </div>

          {sortedData.length > 10 && (
            <div className="flex items-center gap-2">
              {tableLimit < sortedData.length ? (
                <>
                  <button
                    type="button"
                    onClick={() => setTableLimit((prev) => Math.min(sortedData.length, prev + 10))}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors"
                  >
                    View More (+10)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTableLimit(sortedData.length)}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1"
                  >
                    Show All ({sortedData.length})
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setTableLimit(10)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md transition-colors"
                >
                  Collapse to Top 10
                </button>
              )}
            </div>
          )}
        </div>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-100 z-10 text-slate-600 font-semibold shadow-xs">
              <tr className="border-b border-slate-200">
                <th
                  onClick={() => handleSort('material')}
                  className="py-3 px-3.5 cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Material</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('supplier')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Supplier</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('balQty')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Bal Qty (kg)</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('totalLT')}
                  className="py-3 px-2.5 text-center cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Total LT</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('requirement')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>LT Req (kg)</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('safetyStock')}
                  className="py-3 px-2.5 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Safety (kg)</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('rol')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>ROL (kg)</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('netAvailable')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Net Avail (kg)</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('suggestedPO')}
                  className="py-3 px-3 text-right cursor-pointer hover:bg-slate-200/60 transition-colors bg-indigo-50/50"
                >
                  <div className="flex items-center justify-end gap-1.5 text-indigo-900 font-bold">
                    <span>Suggested PO</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-indigo-700" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('daysCover')}
                  className="py-3 px-2.5 text-right cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Days Cover</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3.5 text-left">Order By Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    No matching yarn lines found for current filters.
                  </td>
                </tr>
              ) : (
                displayedRows.map((item) => {
                  const orderInfo = getOrderByInfo(item);
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        item.status === 'Critical' ? 'bg-red-50/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3.5">
                        <div className="font-semibold text-slate-900">{item.material}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.code}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[140px] truncate" title={item.supplier}>
                        {item.supplier}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-800">
                        {item.balQty.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2.5 text-center font-mono tabular-nums text-slate-600">
                        {item.totalLT}d
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-600">
                        {item.requirement.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-2.5 text-right font-mono tabular-nums text-slate-500">
                        {item.safetyStock.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-800">
                        {item.rol.toLocaleString()}
                      </td>
                      <td
                        className={`py-2.5 px-3 text-right font-mono tabular-nums font-semibold ${
                          item.netAvailable <= 0
                            ? 'text-red-600 font-bold'
                            : item.netAvailable < item.rol
                            ? 'text-amber-700'
                            : 'text-slate-800'
                        }`}
                      >
                        {item.netAvailable.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-indigo-700 bg-indigo-50/30">
                        {item.suggestedPO > 0 ? `${item.suggestedPO.toLocaleString()} kg` : '—'}
                      </td>
                      <td
                        className={`py-2.5 px-2.5 text-right font-mono tabular-nums font-medium ${
                          item.daysCover !== null && item.daysCover < (item.totalLT || 30)
                            ? 'text-red-600 font-bold'
                            : 'text-slate-600'
                        }`}
                      >
                        {item.daysCover !== null ? `${item.daysCover}d` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
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
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        {orderInfo.isUrgent ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 font-semibold rounded text-[11px]">
                              <AlertTriangle className="w-3 h-3 text-red-600" />
                              {orderInfo.label}
                            </span>
                            <span className="text-[10px] text-red-600 font-mono">
                              {orderInfo.dateStr}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-slate-800 text-xs">
                              {orderInfo.label}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {orderInfo.dateStr}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {sortedData.length > 10 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {displayedRows.length} of {sortedData.length} items (scroll list above)
            </span>
            <div className="flex items-center gap-2">
              {tableLimit < sortedData.length ? (
                <>
                  <button
                    type="button"
                    onClick={() => setTableLimit((prev) => Math.min(sortedData.length, prev + 10))}
                    className="font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    View More (+10 to scroll)
                  </button>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setTableLimit(sortedData.length)}
                    className="font-medium text-slate-600 hover:text-slate-900"
                  >
                    Show All ({sortedData.length})
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setTableLimit(10)}
                  className="font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Collapse to Top 10
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section: Grouped Supplier POs + Days of Cover Urgency List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Suggested POs grouped by supplier (collapsible) */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Suggested POs Grouped by Supplier
                </h3>
                <p className="text-xs text-slate-500">
                  {supplierLimit < supplierPOGroups.length
                    ? `Showing top ${displayedSupplierGroups.length} of ${supplierPOGroups.length} vendors with pending POs`
                    : `All ${supplierPOGroups.length} vendors with pending POs`}
                </p>
              </div>
            </div>

            {supplierPOGroups.length > 10 && (
              <button
                type="button"
                onClick={() =>
                  setSupplierLimit((prev) =>
                    prev >= supplierPOGroups.length ? 10 : Math.min(supplierPOGroups.length, prev + 10)
                  )
                }
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md transition-colors"
              >
                {supplierLimit >= supplierPOGroups.length
                  ? 'Collapse to Top 10'
                  : `View More (+${supplierPOGroups.length - supplierLimit} vendors)`}
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {displayedSupplierGroups.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                No outstanding suggested purchase orders for any supplier.
              </div>
            ) : (
              displayedSupplierGroups.map((group) => {
                const isCollapsed = collapsedSuppliers[group.supplier];
                const isItemsExpanded = expandedSupplierItems[group.supplier];
                const itemsToRender = isItemsExpanded ? group.items : group.items.slice(0, 10);

                return (
                  <div
                    key={group.supplier}
                    className="border border-slate-200 rounded-lg overflow-hidden transition-all"
                  >
                    {/* Header */}
                    <button
                      type="button"
                      onClick={() => toggleSupplierCollapse(group.supplier)}
                      className="w-full flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 text-left transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                          {group.supplier}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          ({group.items.length} {group.items.length === 1 ? 'item' : 'items'})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Total Ask:</span>
                        <span className="text-xs sm:text-sm font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {group.totalPOQty.toLocaleString()} kg
                        </span>
                      </div>
                    </button>

                    {/* Collapsible item list */}
                    {!isCollapsed && (
                      <div className="divide-y divide-slate-100 bg-white">
                        {itemsToRender.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/50"
                          >
                            <div className="max-w-md">
                              <span className="font-semibold text-slate-800">{item.material}</span>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>Net: {item.netAvailable.toLocaleString()} kg</span>
                                <span>·</span>
                                <span>ROL: {item.rol.toLocaleString()} kg</span>
                                <span>·</span>
                                <span>LT: {item.totalLT} days</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-mono font-bold text-indigo-700 text-sm">
                                {item.suggestedPO.toLocaleString()} kg
                              </span>
                              <span
                                className={`block text-[10px] font-semibold mt-0.5 ${
                                  item.status === 'Critical' ? 'text-red-600' : 'text-amber-600'
                                }`}
                              >
                                {item.status}
                              </span>
                            </div>
                          </div>
                        ))}

                        {group.items.length > 10 && (
                          <div className="p-2 bg-slate-50 text-center">
                            <button
                              type="button"
                              onClick={() => toggleSupplierItemsExpand(group.supplier)}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                            >
                              {isItemsExpanded
                                ? 'Collapse to top 10 items'
                                : `View More (${group.items.length - 10} more items for this supplier)`}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Days of Cover Ranked List */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-600" />
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Stockout Urgency
                  </h3>
                  <p className="text-xs text-slate-500">
                    {urgencyLimit < allUrgentItems.length
                      ? `Top ${displayedUrgentItems.length} of ${allUrgentItems.length} materials (lowest cover first)`
                      : `All ${allUrgentItems.length} materials ranked`}
                  </p>
                </div>
              </div>
            </div>

            <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto pr-1">
              {displayedUrgentItems.map((item, idx) => {
                const isLeadTimeBreached = item.daysCover !== null && item.daysCover < item.totalLT;
                return (
                  <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="max-w-[190px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-400 text-[10px] w-4">{idx + 1}.</span>
                        <span className="font-semibold text-slate-900 truncate" title={item.material}>
                          {item.material}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate pl-5" title={item.supplier}>
                        {item.supplier}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-mono font-bold text-xs tabular-nums ${
                          isLeadTimeBreached ? 'text-red-600' : 'text-slate-800'
                        }`}
                      >
                        {item.daysCover !== null ? `${item.daysCover} days` : '—'}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        LT: {item.totalLT}d
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {allUrgentItems.length > 10 && (
            <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{displayedUrgentItems.length} of {allUrgentItems.length} items</span>
              <button
                type="button"
                onClick={() =>
                  setUrgencyLimit((prev) =>
                    prev >= allUrgentItems.length ? 10 : Math.min(allUrgentItems.length, prev + 10)
                  )
                }
                className="font-medium text-indigo-600 hover:text-indigo-800"
              >
                {urgencyLimit >= allUrgentItems.length ? 'Show Top 10' : `View More (+${allUrgentItems.length - urgencyLimit} more)`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
