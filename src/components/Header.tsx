import React, { useRef, useState } from 'react';
import { 
  Upload, 
  HelpCircle, 
  FileSpreadsheet, 
  Download, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { downloadSampleExcel } from '../utils/sampleData';
import { MethodologyModal } from './MethodologyModal';

export const Header: React.FC = () => {
  const { 
    dataset,
    metadata, 
    loadFile, 
    loadSampleData, 
    isLoading, 
    errorMessage, 
    dismissError 
  } = useInventory();

  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await loadFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const hasData = dataset.length > 0;

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        {/* Top Bar: Strict 3-zone contract */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Zone 1: Single text element wordmark */}
            <div className="flex items-center gap-3">
              <a href="#" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs group-hover:bg-indigo-600 transition-colors">
                  <span className="font-mono font-bold text-sm">SG</span>
                </div>
                <div>
                  <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Stretchline Global
                  </span>
                  <span className="hidden sm:inline-block ml-2 text-xs text-slate-400 font-medium">
                    Raw Yarn Portal
                  </span>
                </div>
              </a>
            </div>

            {/* Zone 2: Snapshot metadata */}
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
              {hasData && metadata && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-slate-700 font-medium bg-slate-100/80 px-2.5 py-1 rounded-md">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="truncate max-w-[200px]" title={metadata.fileName}>
                      {metadata.fileName}
                    </span>
                    {metadata.isSample && (
                      <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded font-semibold">
                        SAMPLE
                      </span>
                    )}
                  </span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="font-mono tabular-nums">{metadata.rowCount} lines</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span>{new Date(metadata.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>

            {/* Zone 3: Actions */}
            <div className="flex items-center gap-2">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
                id="yarn-file-input"
              />

              {hasData && (
                <>
                  {/* Upload Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Replace Report</span>
                  </button>

                  {/* Sample Data Button */}
                  <button
                    type="button"
                    onClick={loadSampleData}
                    disabled={isLoading}
                    title="Reload realistic industrial sample data"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Reload Sample</span>
                  </button>
                </>
              )}

              {/* Download Template */}
              <button
                type="button"
                onClick={downloadSampleExcel}
                title="Download blank / sample Excel template for yarn allocation"
                className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span>Template</span>
              </button>

              {/* Methodology Modal Trigger */}
              <button
                type="button"
                onClick={() => setIsMethodologyOpen(true)}
                title="View risk and reorder calculation formulas"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="View methodology"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Global Drag-and-drop indicator bar if user drags files over header */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`transition-all duration-150 border-t ${
            isDragging 
              ? 'bg-indigo-50 border-indigo-300 py-2.5 text-center text-xs font-medium text-indigo-700' 
              : 'border-transparent h-0 overflow-hidden'
          }`}
        >
          Drop Yarn Allocation Report (.xlsx, .xls, .csv) here to parse client-side
        </div>
      </header>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-3 text-xs text-red-800">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-red-950">File Processing Error: </span>
                {errorMessage}
              </div>
            </div>
            <button
              onClick={dismissError}
              className="text-red-600 hover:text-red-900 font-semibold px-2 py-0.5"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </>
  );
};
