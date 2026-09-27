import React from 'react';
import { X, Calculator, Clock, ShieldAlert, CheckCircle2, AlertTriangle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodologyModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="methodology-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 id="methodology-title" className="text-base font-semibold text-slate-900">
                Inventory Risk & Reorder Methodology
              </h2>
              <p className="text-xs text-slate-500">
                Mathematical model & lead time computation rules for raw yarn allocation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600">
          {/* Note on recomputation */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900 leading-relaxed">
            <span className="font-semibold text-amber-950">Dynamic Recomputation Standard:</span> In order to guarantee auditability and eliminate stale formulas in spreadsheet exports, all derived metrics (<span className="font-mono font-medium">Total LT</span>, <span className="font-mono font-medium">Requirement</span>, <span className="font-mono font-medium">ROL</span>, <span className="font-mono font-medium">Suggested PO</span>) are calculated directly in browser from base manufacturing inputs.
          </div>

          {/* Core Formulas */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-slate-900 uppercase mb-3">
              1. Core Reorder Calculations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
                <div className="text-xs font-medium text-slate-500 mb-1">Total Lead Time (Days)</div>
                <div className="font-mono text-xs text-indigo-700 font-semibold mb-1.5">
                  totalLT = EP + SML + SPL + STT + CL + SIL
                </div>
                <p className="text-xs text-slate-500">
                  Full cumulative duration from order placement to physical plant inward.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
                <div className="text-xs font-medium text-slate-500 mb-1">Daily Run Rate (kg/day)</div>
                <div className="font-mono text-xs text-indigo-700 font-semibold mb-1.5">
                  dailyCons = cons30 / 30
                </div>
                <p className="text-xs text-slate-500">
                  Daily consumption based on past 30 days actuals (fallback to monthlyAvg / 30).
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
                <div className="text-xs font-medium text-slate-500 mb-1">Lead Time Requirement (kg)</div>
                <div className="font-mono text-xs text-indigo-700 font-semibold mb-1.5">
                  requirement = dailyCons × totalLT
                </div>
                <p className="text-xs text-slate-500">
                  Total yarn volume that will be consumed during the full replenishment lead time.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
                <div className="text-xs font-medium text-slate-500 mb-1">Reorder Level — ROL (kg)</div>
                <div className="font-mono text-xs text-indigo-700 font-semibold mb-1.5">
                  rol = requirement + safetyStock
                </div>
                <p className="text-xs text-slate-500">
                  Trigger point where net available inventory can no longer guarantee production without ordering.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
                <div className="text-xs font-medium text-slate-500 mb-1">Net Available Stock (kg)</div>
                <div className="font-mono text-xs text-indigo-700 font-semibold mb-1.5">
                  netAvailable = balQty - (allocConfirmed + allocProjection)
                </div>
                <p className="text-xs text-slate-500">
                  Uncommitted free yarn remaining after deducting confirmed loom setups and planned projections.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg">
                <div className="text-xs font-medium text-slate-500 mb-1">Suggested PO Volume (kg)</div>
                <div className="font-mono text-xs text-indigo-700 font-semibold mb-1.5">
                  suggestedPO = max(0, rol - netAvailable)
                </div>
                <p className="text-xs text-slate-500">
                  Exact order quantity required to replenish free stock back to the safe ROL threshold.
                </p>
              </div>
            </div>
          </div>

          {/* Status Definitions */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-slate-900 uppercase mb-3">
              2. Inventory Health Status Thresholds
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-red-50/70 border border-red-200 rounded-lg">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-red-900 mb-1">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Critical
                </div>
                <div className="font-mono text-xs text-red-700 font-medium mb-1">
                  netAvailable ≤ 0 kg
                </div>
                <p className="text-xs text-red-800">
                  Allocations exceed physical warehouse balance. Immediate loom stop risk.
                </p>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900 mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Reorder Needed
                </div>
                <div className="font-mono text-xs text-amber-700 font-medium mb-1">
                  0 &lt; netAvailable &lt; rol
                </div>
                <p className="text-xs text-amber-800">
                  Stock is positive but below the replenishment buffer. PO must be placed now.
                </p>
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-900 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Healthy
                </div>
                <div className="font-mono text-xs text-emerald-700 font-medium mb-1">
                  netAvailable ≥ rol
                </div>
                <p className="text-xs text-emerald-800">
                  Free stock safely exceeds lead time requirement and safety buffer.
                </p>
              </div>
            </div>
          </div>

          {/* Lead Time Breakdown */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider text-slate-900 uppercase mb-3">
              3. Supply Chain Lead Time Breakdown (Days)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
                <span className="font-mono font-bold text-slate-800">EP</span>
                <span className="block text-slate-500 text-[11px] mt-0.5">Enterprise PO processing & ERP transmission</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
                <span className="font-mono font-bold text-slate-800">SML</span>
                <span className="block text-slate-500 text-[11px] mt-0.5">Supplier extrusion & spinning manufacturing LT</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
                <span className="font-mono font-bold text-slate-800">SPL</span>
                <span className="block text-slate-500 text-[11px] mt-0.5">Origin port container stuffing & customs (up to ETD)</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
                <span className="font-mono font-bold text-slate-800">STT</span>
                <span className="block text-slate-500 text-[11px] mt-0.5">Ocean freight transit time (ETD to ETA)</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
                <span className="font-mono font-bold text-slate-800">CL</span>
                <span className="block text-slate-500 text-[11px] mt-0.5">Destination port clearance & inland drayage</span>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-md">
                <span className="font-mono font-bold text-slate-800">SIL</span>
                <span className="block text-slate-500 text-[11px] mt-0.5">Plant receiving, QA lab inspection & GRN release</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Standardized for Elastic Manufacturing Plants · ISO 9001:2015</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close Reference
          </button>
        </div>
      </div>
    </div>
  );
};
