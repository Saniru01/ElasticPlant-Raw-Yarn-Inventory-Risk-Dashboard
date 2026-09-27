export type YarnStatus = 'Critical' | 'Reorder Needed' | 'Healthy';

export type YarnCategory = 'DTY' | 'SPANDEX' | 'FDY' | 'LATEX' | 'OTHER';

export interface YarnItem {
  id: string;
  // Source fields
  supplier: string;
  code: string;
  material: string;
  monthlyAvg: number; // kg
  balQty: number; // kg
  cons30: number; // kg
  ep: number; // EP order processing time (days)
  sml: number; // Supplier manufacturing LT (days)
  spl: number; // Shipment preparation LT (days)
  stt: number; // Shipment transit time (days)
  cl: number; // Clearance & Logistics (days)
  sil: number; // Shipment Incoming LT (days)
  safetyStock: number; // kg
  allocConfirmed: number; // kg
  allocProjection: number; // kg
  comments: string;

  // Derived fields
  totalLT: number; // days = ep + sml + spl + stt + cl + sil
  dailyCons: number; // kg/day = cons30 / 30 (fallback monthlyAvg / 30)
  requirement: number; // kg = dailyCons * totalLT
  rol: number; // kg = requirement + safetyStock
  allocTotal: number; // kg = allocConfirmed + allocProjection
  netAvailable: number; // kg = balQty - allocTotal
  suggestedPO: number; // kg = Math.max(0, rol - netAvailable)
  daysCover: number | null; // balQty / dailyCons
  status: YarnStatus;
  category: YarnCategory;
  country: string;
  countryCode: string;

  // Parsed Material Attributes
  attributes: {
    denier: string; // e.g. "75D", "140D"
    filament: string; // e.g. "36F", "72F"
    twistOrLuster: string; // e.g. "RW", "SD", "FD", "S-TWIST", "Z-TWIST"
    color: string; // e.g. "WHITE", "BLACK", "RAW"
  };
}

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  rowCount: number;
  isSample?: boolean;
}

export interface SupplierScorecard {
  supplier: string;
  materialCount: number;
  totalBalance: number;
  totalMonthlyCons: number;
  criticalCount: number;
  reorderCount: number;
  healthyCount: number;
  avgTotalLT: number;
  suggestedPOQty: number;
}

export interface CategorySummary {
  category: YarnCategory;
  materialCount: number;
  totalBalance: number;
  totalMonthlyCons: number;
  criticalCount: number;
  reorderCount: number;
  healthyCount: number;
  totalSuggestedPO: number;
}

export interface SubstituteGroup {
  groupKey: string;
  category: YarnCategory;
  spec: string;
  items: YarnItem[];
  suppliers: string[];
  totalBalance: number;
  minLT: number;
  maxLT: number;
}
