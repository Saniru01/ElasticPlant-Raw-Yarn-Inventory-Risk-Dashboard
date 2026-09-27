import React, { useMemo, useState } from 'react';
import { useInventory } from '../../context/InventoryContext';
import { YarnItem } from '../../types/inventory';
import {
  Search,
  Download,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
} from 'lucide-react';

interface ColumnDef {
  key: keyof YarnItem | 'attributes_str';
  label: string;
  category: 'raw' | 'derived';
  align?: 'left' | 'right' | 'center';
  formatter?: (item: YarnItem) => string | number;
}

const ALL_COLUMNS: ColumnDef[] = [
  // Raw source fields
  { key: 'code', label: 'Item Code', category: 'raw', align: 'left' },
  { key: 'material', label: 'Material Name', category: 'raw', align: 'left' },
  { key: 'supplier', label: 'Supplier', category: 'raw', align: 'left' },
  {
    key: 'monthlyAvg',
    label: 'Monthly Avg (kg)',
    category: 'raw',
    align: 'right',
    formatter: (i) => i.monthlyAvg.toLocaleString(),
  },
  {
    key: 'balQty',
    label: 'Bal Qty (kg)',
    category: 'raw',
    align: 'right',
    formatter: (i) => i.balQty.toLocaleString(),
  },
  {
    key: 'cons30',
    label: '30-Day Cons (kg)',
    category: 'raw',
    align: 'right',
    formatter: (i) => i.cons30.toLocaleString(),
  },
  { key: 'ep', label: 'EP LT (d)', category: 'raw', align: 'center' },
  { key: 'sml', label: 'SML LT (d)', category: 'raw', align: 'center' },
  { key: 'spl', label: 'SPL LT (d)', category: 'raw', align: 'center' },
  { key: 'stt', label: 'STT LT (d)', category: 'raw', align: 'center' },
  { key: 'cl', label: 'CL LT (d)', category: 'raw', align: 'center' },
  { key: 'sil', label: 'SIL LT (d)', category: 'raw', align: 'center' },
  {
    key: 'safetyStock',
    label: 'Safety Stock (kg)',
    category: 'raw',
    align: 'right',
    formatter: (i) => i.safetyStock.toLocaleString(),
  },
  {
    key: 'allocConfirmed',
    label: 'Alloc Confirmed (kg)',
    category: 'raw',
    align: 'right',
    formatter: (i) => i.allocConfirmed.toLocaleString(),
  },
  {
    key: 'allocProjection',
    label: 'Alloc Projection (kg)',
    category: 'raw',
    align: 'right',
    formatter: (i) => i.allocProjection.toLocaleString(),
  },
  { key: 'comments', label: 'Comments', category: 'raw', align: 'left' },

  // Derived fields
  { key: 'totalLT', label: 'Total LT (d)', category: 'derived', align: 'center' },
  {
    key: 'dailyCons',
    label: 'Daily Cons (kg/d)',
    category: 'derived',
    align: 'right',
    formatter: (i) => Math.round(i.dailyCons * 10) / 10,
  },
  {
    key: 'requirement',
    label: 'LT Req (kg)',
    category: 'derived',
    align: 'right',
    formatter: (i) => i.requirement.toLocaleString(),
  },
  {
    key: 'rol',
    label: 'ROL (kg)',
    category: 'derived',
    align: 'right',
    formatter: (i) => i.rol.toLocaleString(),
  },
  {
    key: 'allocTotal',
    label: 'Alloc Total (kg)',
    category: 'derived',
    align: 'right',
    formatter: (i) => i.allocTotal.toLocaleString(),
  },
  {
    key: 'netAvailable',
    label: 'Net Available (kg)',
    category: 'derived',
    align: 'right',
    formatter: (i) => i.netAvailable.toLocaleString(),
  },
  {
    key: 'suggestedPO',
    label: 'Suggested PO (kg)',
    category: 'derived',
    align: 'right',
    formatter: (i) => (i.suggestedPO > 0 ? i.suggestedPO.toLocaleString() : '0'),
  },
  {
    key: 'daysCover',
    label: 'Days of Cover',
    category: 'derived',
    align: 'right',
    formatter: (i) => (i.daysCover !== null ? `${i.daysCover}d` : '—'),
  },
  { key: 'status', label: 'Health Status', category: 'derived', align: 'center' },
  { key: 'category', label: 'Fiber Category', category: 'derived', align: 'left' },
  { key: 'country', label: 'Origin Country', category: 'derived', align: 'left' },
];

export const MasterLogTab: React.FC = () => {
  const { dataset, masterLogFilters, setMasterLogFilters } = useInventory();
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);

  const { search, hiddenColumns, sortBy, sortOrder, page, pageSize } = masterLogFilters;

  // Visible columns
  const visibleColumns = useMemo(() => {
    return ALL_COLUMNS.filter((col) => !hiddenColumns.includes(col.key));
  }, [hiddenColumns]);

  // Global search across all fields
  const filteredData = useMemo(() => {
    if (!search.trim()) return dataset;
    const q = search.toLowerCase();

    return dataset.filter((item) => {
      return (
        item.material.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.supplier.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.country.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q) ||
        item.comments.toLowerCase().includes(q) ||
        item.attributes.denier.toLowerCase().includes(q) ||
        item.attributes.filament.toLowerCase().includes(q)
      );
    });
  }, [dataset, search]);

  // Sort data
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortBy as keyof YarnItem];
      const bVal = b[sortBy as keyof YarnItem];

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

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setMasterLogFilters((prev) => ({
        ...prev,
        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc',
      }));
    } else {
      setMasterLogFilters((prev) => ({
        ...prev,
        sortBy: key,
        sortOrder: 'desc',
      }));
    }
  };

  const toggleColumn = (key: string) => {
    setMasterLogFilters((prev) => {
      const isHidden = prev.hiddenColumns.includes(key);
      const nextHidden = isHidden
        ? prev.hiddenColumns.filter((k) => k !== key)
        : [...prev.hiddenColumns, key];
      return { ...prev, hiddenColumns: nextHidden };
    });
  };

  const resetColumns = () => {
    setMasterLogFilters((prev) => ({ ...prev, hiddenColumns: [] }));
  };

  // Export current filtered & sorted view to real CSV
  const handleExportCSV = () => {
    const headers = visibleColumns.map((col) => `"${col.label.replace(/"/g, '""')}"`);
    const rows = sortedData.map((item) => {
      return visibleColumns.map((col) => {
        let val: unknown = item[col.key as keyof YarnItem];
        if (col.formatter) {
          val = col.formatter(item);
        } else if (val === null || val === undefined) {
          val = '';
        }
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      }).join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Master_Yarn_Log_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Header bar: Search, Columns toggle, and CSV Export */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Global search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search across all raw inputs & derived metrics..."
              value={search}
              onChange={(e) =>
                setMasterLogFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
              }
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2 relative">
            {/* Columns Toggle Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsColumnDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Columns ({visibleColumns.length}/{ALL_COLUMNS.length})</span>
              </button>

              {isColumnDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-40 text-xs animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-900">Configure Visible Columns</span>
                    <button
                      onClick={resetColumns}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Show All
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-1">
                      Raw Report Inputs
                    </div>
                    {ALL_COLUMNS.filter((c) => c.category === 'raw').map((col) => {
                      const isVisible = !hiddenColumns.includes(col.key);
                      return (
                        <label
                          key={col.key}
                          className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => toggleColumn(col.key)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-700">{col.label}</span>
                        </label>
                      );
                    })}

                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 pt-2">
                      Computed Risk Fields
                    </div>
                    {ALL_COLUMNS.filter((c) => c.category === 'derived').map((col) => {
                      const isVisible = !hiddenColumns.includes(col.key);
                      return (
                        <label
                          key={col.key}
                          className="flex items-center gap-2 px-1 py-1 hover:bg-slate-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isVisible}
                            onChange={() => toggleColumn(col.key)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-slate-700 font-medium text-indigo-950">
                            {col.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => setIsColumnDropdownOpen(false)}
                      className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-medium"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Export CSV button */}
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dense Data Grid */}
      <div className="bg-white border border-slate-200/80 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[640px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead className="sticky top-0 bg-slate-100 z-10 text-slate-600 font-semibold border-b border-slate-200 shadow-xs">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center font-mono text-slate-400">#</th>
                {visibleColumns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`py-2.5 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors whitespace-nowrap ${
                      col.category === 'derived' ? 'bg-indigo-50/40 text-indigo-950' : ''
                    } ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === 'right'
                          ? 'justify-end'
                          : col.align === 'center'
                          ? 'justify-center'
                          : 'justify-start'
                      }`}
                    >
                      <span>{col.label}</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="py-12 text-center text-slate-400">
                    No records match the current search query.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, rowIdx) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      item.status === 'Critical' ? 'bg-red-50/15' : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-center font-mono text-slate-400 tabular-nums">
                      {(page - 1) * pageSize + rowIdx + 1}
                    </td>

                    {visibleColumns.map((col) => {
                      let cellContent: React.ReactNode = item[col.key as keyof YarnItem] as React.ReactNode;
                      if (col.formatter) {
                        cellContent = col.formatter(item);
                      }

                      // Specific status pill render
                      if (col.key === 'status') {
                        cellContent = (
                          <span
                            className={`inline-block px-1.5 py-0.2 rounded font-semibold text-[10px] ${
                              item.status === 'Critical'
                                ? 'bg-red-100 text-red-800'
                                : item.status === 'Reorder Needed'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        );
                      }

                      // Highlight Suggested PO
                      if (col.key === 'suggestedPO') {
                        cellContent = (
                          <span
                            className={`font-mono font-bold ${
                              item.suggestedPO > 0 ? 'text-indigo-700' : 'text-slate-400'
                            }`}
                          >
                            {cellContent}
                          </span>
                        );
                      }

                      // Highlight Net Available
                      if (col.key === 'netAvailable') {
                        cellContent = (
                          <span
                            className={`font-mono font-semibold ${
                              item.netAvailable <= 0
                                ? 'text-red-600 font-bold'
                                : item.netAvailable < item.rol
                                ? 'text-amber-700'
                                : 'text-slate-800'
                            }`}
                          >
                            {cellContent}
                          </span>
                        );
                      }

                      return (
                        <td
                          key={col.key}
                          className={`py-2 px-3 whitespace-nowrap ${
                            col.align === 'right'
                              ? 'text-right font-mono tabular-nums'
                              : col.align === 'center'
                              ? 'text-center font-mono'
                              : 'text-left'
                          } ${
                            col.category === 'derived' ? 'bg-indigo-50/15' : ''
                          }`}
                        >
                          {cellContent ?? '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Status Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              Showing <span className="font-semibold text-slate-800 font-mono">{(page - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-slate-800 font-mono">
                {Math.min(page * pageSize, sortedData.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-800 font-mono">{sortedData.length}</span> total rows
            </div>

            {/* Quick View More / Expand controls */}
            {sortedData.length > 10 && (
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                {pageSize < sortedData.length ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setMasterLogFilters((prev) => ({
                          ...prev,
                          pageSize: Math.min(sortedData.length, prev.pageSize + 10),
                          page: 1,
                        }))
                      }
                      className="font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition-colors"
                    >
                      View More (+10 to scroll)
                    </button>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <button
                      type="button"
                      onClick={() =>
                        setMasterLogFilters((prev) => ({
                          ...prev,
                          pageSize: sortedData.length,
                          page: 1,
                        }))
                      }
                      className="font-medium text-slate-600 hover:text-slate-900"
                    >
                      Show All ({sortedData.length})
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setMasterLogFilters((prev) => ({
                        ...prev,
                        pageSize: 10,
                        page: 1,
                      }))
                    }
                    className="font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded transition-colors"
                  >
                    Collapse to Top 10
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMasterLogFilters((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={page <= 1}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-mono text-xs">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setMasterLogFilters((prev) => ({ ...prev, page: Math.min(totalPages, prev.page + 1) }))}
              disabled={page >= totalPages}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
