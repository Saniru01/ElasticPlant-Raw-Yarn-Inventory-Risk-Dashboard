import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, RefreshCw, Download, ArrowUpRight } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { downloadSampleExcel } from '../utils/sampleData';

export const EmptyState: React.FC = () => {
  const { loadFile, loadSampleData, isLoading } = useInventory();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await loadFile(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await loadFile(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div 
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        className={`bg-white rounded-2xl border-2 border-dashed p-10 text-center transition-all ${
          isDragging ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
          <FileSpreadsheet className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Upload Yarn Allocation Report
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Drag and drop your plant's raw yarn allocation spreadsheet (.xlsx, .xls, .csv).
          All risk metrics and lead-time calculations run securely inside your browser.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>Select File to Upload</span>
          </button>

          <button
            type="button"
            onClick={loadSampleData}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span>Load Demo Plant Data</span>
          </button>
        </div>

        <div className="border-t border-slate-200/80 pt-6 max-w-lg mx-auto">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Need a formatted file to get started?</span>
            <button
              onClick={downloadSampleExcel}
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
