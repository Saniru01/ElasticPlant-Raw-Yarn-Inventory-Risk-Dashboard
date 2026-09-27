import React, { useRef, useState } from 'react';
import { 
  Upload, 
  Database, 
  RefreshCw, 
  Download, 
  ArrowRight, 
  ShieldCheck, 
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div 
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className="min-h-[75vh] flex flex-col items-center justify-center py-10 px-4 sm:px-6"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="max-w-3xl w-full text-center">
        {/* Plant Kicker */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
          <span>Stretchline Global · Raw Yarn Inventory Intelligence</span>
        </div>

        {/* Corporate Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 leading-tight">
          Executive Yarn Allocation &amp; Inventory Risk Portal
        </h1>

        <p className="mt-4 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Comprehensive client-side evaluation of warehouse stock balances, confirmed &amp; projected loom allocations, lead-time deficit scheduling, and multi-vendor sourcing concentration.
        </p>

        {/* Two Prominent Corporate Start Buttons */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Button 1: Primary Upload Action */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className={`group relative p-6 sm:p-7 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-xl transition-all duration-200 text-left flex flex-col justify-between border border-slate-800 focus:outline-hidden focus:ring-4 focus:ring-slate-900/20 cursor-pointer ${
              isDragging ? 'ring-4 ring-indigo-500 bg-slate-800' : ''
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  {isLoading ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>

              <div className="text-lg font-bold text-white tracking-tight">
                Upload Allocation Report
              </div>
              <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                Select your plant's Yarn Allocation spreadsheet (.xlsx, .xls, or .csv)
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Drop file directly here</span>
              <span className="font-mono text-indigo-400 font-semibold">100% In-Browser</span>
            </div>
          </button>

          {/* Button 2: Secondary Load Sample Action */}
          <button
            type="button"
            onClick={loadSampleData}
            disabled={isLoading}
            className="group relative p-6 sm:p-7 rounded-2xl bg-white hover:bg-slate-50/80 text-slate-900 shadow-sm hover:shadow-lg transition-all duration-200 text-left flex flex-col justify-between border-2 border-slate-200/90 hover:border-slate-300 focus:outline-hidden focus:ring-4 focus:ring-indigo-500/10 cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                  <Database className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
              </div>

              <div className="text-lg font-bold text-slate-900 tracking-tight">
                Explore with Demo Data
              </div>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Load active industrial dataset with 42 yarn lines across 11 global suppliers
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Instant preview</span>
              <span className="font-mono text-slate-700 font-semibold">Pre-Calculated</span>
            </div>
          </button>
        </div>

        {/* Drag and Drop notice if dragging */}
        {isDragging && (
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-indigo-700 animate-pulse">
            Release mouse to upload and parse your Yarn Allocation file
          </div>
        )}

        {/* Secondary Download Template Link */}
        <div className="mt-8 pt-6 border-t border-slate-200/80 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
            <span>Need a formatted file structure?</span>
          </div>

          <button
            type="button"
            onClick={downloadSampleExcel}
            className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Excel Template (.xlsx)</span>
          </button>
        </div>

        {/* Corporate Trust Markers */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero Server Transmission (Client-Only)</span>
          </div>
          <span aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dynamic Reorder &amp; Lead Time Engine</span>
          </div>
          <span aria-hidden="true">·</span>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>ISO 9001:2015 Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};
