import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  YarnItem,
  FileMetadata,
  SupplierScorecard,
  CategorySummary,
  SubstituteGroup,
  YarnCategory,
} from '../types/inventory';
import { parseYarnAllocationFile } from '../utils/parser';
import { getSampleYarnData } from '../utils/sampleData';

interface OperationalFilters {
  search: string;
  supplier: string;
  category: string;
  status: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface SupplierFilters {
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface CategoryFilters {
  category: string;
  denier: string;
  filament: string;
  color: string;
  search: string;
}

interface MasterLogFilters {
  search: string;
  hiddenColumns: string[];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  page: number;
  pageSize: number;
}

export type TabId = 'executive' | 'operational' | 'supplier' | 'category' | 'master';

interface InventoryContextType {
  dataset: YarnItem[];
  metadata: FileMetadata | null;
  isLoading: boolean;
  errorMessage: string | null;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  loadFile: (file: File) => Promise<boolean>;
  loadSampleData: () => void;
  clearData: () => void;
  dismissError: () => void;

  // Tab filter states (persisted across tab switches)
  operationalFilters: OperationalFilters;
  setOperationalFilters: React.Dispatch<React.SetStateAction<OperationalFilters>>;
  supplierFilters: SupplierFilters;
  setSupplierFilters: React.Dispatch<React.SetStateAction<SupplierFilters>>;
  categoryFilters: CategoryFilters;
  setCategoryFilters: React.Dispatch<React.SetStateAction<CategoryFilters>>;
  masterLogFilters: MasterLogFilters;
  setMasterLogFilters: React.Dispatch<React.SetStateAction<MasterLogFilters>>;

  // Aggregated summaries
  metrics: {
    totalLines: number;
    totalSuppliers: number;
    totalBalance: number;
    criticalCount: number;
    reorderCount: number;
    healthyCount: number;
    totalSuggestedPO: number;
    totalMonthlyCons: number;
    needPOCount: number; // critical + reorder
  };
  supplierScorecards: SupplierScorecard[];
  categorySummaries: CategorySummary[];
  substituteGroups: SubstituteGroup[];
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataset, setDataset] = useState<YarnItem[]>([]);
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('executive');

  // Independent Tab filter states
  const [operationalFilters, setOperationalFilters] = useState<OperationalFilters>({
    search: '',
    supplier: 'ALL',
    category: 'ALL',
    status: 'ALL',
    sortBy: 'suggestedPO',
    sortOrder: 'desc',
  });

  const [supplierFilters, setSupplierFilters] = useState<SupplierFilters>({
    search: '',
    sortBy: 'criticalCount',
    sortOrder: 'desc',
  });

  const [categoryFilters, setCategoryFilters] = useState<CategoryFilters>({
    category: 'ALL',
    denier: 'ALL',
    filament: 'ALL',
    color: 'ALL',
    search: '',
  });

  const [masterLogFilters, setMasterLogFilters] = useState<MasterLogFilters>({
    search: '',
    hiddenColumns: [],
    sortBy: 'suggestedPO',
    sortOrder: 'desc',
    page: 1,
    pageSize: 10,
  });

  const loadSampleData = () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const sampleItems = getSampleYarnData();
      setDataset(sampleItems);
      setMetadata({
        fileName: 'Yarn_Allocation_Report_Q3_PlantA.xlsx',
        fileSize: 42800,
        uploadedAt: new Date(),
        rowCount: sampleItems.length,
        isSample: true,
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error loading sample data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFile = async (file: File): Promise<boolean> => {
    setIsLoading(true);
    setErrorMessage(null);

    const result = await parseYarnAllocationFile(file);
    if (!result.success || result.data.length === 0) {
      setErrorMessage(result.error || 'Failed to parse file.');
      setIsLoading(false);
      return false;
    }

    setDataset(result.data);
    setMetadata({
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date(),
      rowCount: result.data.length,
      isSample: false,
    });

    // Reset pagination
    setMasterLogFilters((prev) => ({ ...prev, page: 1 }));
    setIsLoading(false);
    return true;
  };

  const clearData = () => {
    setDataset([]);
    setMetadata(null);
    setErrorMessage(null);
  };

  const dismissError = () => {
    setErrorMessage(null);
  };

  // Aggregated Metrics
  const metrics = useMemo(() => {
    const totalLines = dataset.length;
    const suppliers = new Set(dataset.map((d) => d.supplier).filter(Boolean));
    const totalSuppliers = suppliers.size;

    let totalBalance = 0;
    let criticalCount = 0;
    let reorderCount = 0;
    let healthyCount = 0;
    let totalSuggestedPO = 0;
    let totalMonthlyCons = 0;

    for (const item of dataset) {
      totalBalance += item.balQty;
      totalMonthlyCons += item.monthlyAvg;
      totalSuggestedPO += item.suggestedPO;

      if (item.status === 'Critical') {
        criticalCount++;
      } else if (item.status === 'Reorder Needed') {
        reorderCount++;
      } else {
        healthyCount++;
      }
    }

    return {
      totalLines,
      totalSuppliers,
      totalBalance: Math.round(totalBalance),
      criticalCount,
      reorderCount,
      healthyCount,
      totalSuggestedPO: Math.round(totalSuggestedPO),
      totalMonthlyCons: Math.round(totalMonthlyCons),
      needPOCount: criticalCount + reorderCount,
    };
  }, [dataset]);

  // Supplier Scorecards (for Tab 3)
  const supplierScorecards = useMemo(() => {
    const map = new Map<string, {
      items: YarnItem[];
      totalBalance: number;
      totalMonthlyCons: number;
      criticalCount: number;
      reorderCount: number;
      healthyCount: number;
      sumLT: number;
      totalSuggestedPO: number;
    }>();

    for (const item of dataset) {
      const s = item.supplier || 'Unassigned';
      if (!map.has(s)) {
        map.set(s, {
          items: [],
          totalBalance: 0,
          totalMonthlyCons: 0,
          criticalCount: 0,
          reorderCount: 0,
          healthyCount: 0,
          sumLT: 0,
          totalSuggestedPO: 0,
        });
      }
      const record = map.get(s)!;
      record.items.push(item);
      record.totalBalance += item.balQty;
      record.totalMonthlyCons += item.monthlyAvg;
      record.sumLT += item.totalLT;
      record.totalSuggestedPO += item.suggestedPO;

      if (item.status === 'Critical') record.criticalCount++;
      else if (item.status === 'Reorder Needed') record.reorderCount++;
      else record.healthyCount++;
    }

    const list: SupplierScorecard[] = [];
    map.forEach((val, supplier) => {
      list.push({
        supplier,
        materialCount: val.items.length,
        totalBalance: Math.round(val.totalBalance),
        totalMonthlyCons: Math.round(val.totalMonthlyCons),
        criticalCount: val.criticalCount,
        reorderCount: val.reorderCount,
        healthyCount: val.healthyCount,
        avgTotalLT: Math.round((val.sumLT / (val.items.length || 1)) * 10) / 10,
        suggestedPOQty: Math.round(val.totalSuggestedPO),
      });
    });

    return list;
  }, [dataset]);

  // Category Summaries (for Tab 4)
  const categorySummaries = useMemo(() => {
    const categories: YarnCategory[] = ['DTY', 'SPANDEX', 'FDY', 'LATEX', 'OTHER'];
    const map = new Map<YarnCategory, {
      count: number;
      balance: number;
      monthlyCons: number;
      critical: number;
      reorder: number;
      healthy: number;
      suggestedPO: number;
    }>();

    categories.forEach((cat) => {
      map.set(cat, {
        count: 0,
        balance: 0,
        monthlyCons: 0,
        critical: 0,
        reorder: 0,
        healthy: 0,
        suggestedPO: 0,
      });
    });

    for (const item of dataset) {
      const cat = item.category || 'OTHER';
      const record = map.get(cat) || map.get('OTHER')!;
      record.count++;
      record.balance += item.balQty;
      record.monthlyCons += item.monthlyAvg;
      record.suggestedPO += item.suggestedPO;

      if (item.status === 'Critical') record.critical++;
      else if (item.status === 'Reorder Needed') record.reorder++;
      else record.healthy++;
    }

    return categories
      .map((cat) => {
        const val = map.get(cat)!;
        return {
          category: cat,
          materialCount: val.count,
          totalBalance: Math.round(val.balance),
          totalMonthlyCons: Math.round(val.monthlyCons),
          criticalCount: val.critical,
          reorderCount: val.reorder,
          healthyCount: val.healthy,
          totalSuggestedPO: Math.round(val.suggestedPO),
        };
      })
      .filter((c) => c.materialCount > 0);
  }, [dataset]);

  // Substitute Groups (for Tab 4)
  const substituteGroups = useMemo(() => {
    const map = new Map<string, YarnItem[]>();

    for (const item of dataset) {
      const den = item.attributes.denier !== '-' ? item.attributes.denier : '';
      const fil = item.attributes.filament !== '-' ? item.attributes.filament : '';
      if (!den && !fil) continue;

      const groupKey = `${item.category}_${den}_${fil}`.toUpperCase();
      if (!map.has(groupKey)) {
        map.set(groupKey, []);
      }
      map.get(groupKey)!.push(item);
    }

    const groups: SubstituteGroup[] = [];
    map.forEach((items, groupKey) => {
      // Meaningful substitute group: at least 2 distinct materials or suppliers
      const uniqueSuppliers = Array.from(new Set(items.map((i) => i.supplier)));
      if (items.length >= 2) {
        const totalBal = items.reduce((acc, curr) => acc + curr.balQty, 0);
        const lts = items.map((i) => i.totalLT);
        groups.push({
          groupKey,
          category: items[0].category,
          spec: `${items[0].attributes.denier} ${items[0].attributes.filament}`.trim(),
          items,
          suppliers: uniqueSuppliers,
          totalBalance: Math.round(totalBal),
          minLT: Math.min(...lts),
          maxLT: Math.max(...lts),
        });
      }
    });

    return groups.sort((a, b) => b.items.length - a.items.length);
  }, [dataset]);

  return (
    <InventoryContext.Provider
      value={{
        dataset,
        metadata,
        isLoading,
        errorMessage,
        activeTab,
        setActiveTab,
        loadFile,
        loadSampleData,
        clearData,
        dismissError,
        operationalFilters,
        setOperationalFilters,
        supplierFilters,
        setSupplierFilters,
        categoryFilters,
        setCategoryFilters,
        masterLogFilters,
        setMasterLogFilters,
        metrics,
        supplierScorecards,
        categorySummaries,
        substituteGroups,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
