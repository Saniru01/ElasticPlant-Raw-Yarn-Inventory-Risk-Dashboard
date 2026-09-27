import * as XLSX from 'xlsx';
import { YarnItem, YarnCategory, YarnStatus } from '../types/inventory';

export const COUNTRY_LOOKUP: Record<string, string> = {
  CHN: 'China',
  TWN: 'Taiwan',
  LKA: 'Sri Lanka',
  KOR: 'South Korea',
  VNM: 'Vietnam',
  ISR: 'Israel',
  ITA: 'Italy',
  SGP: 'Singapore',
  JPN: 'Japan',
  THA: 'Thailand',
  IND: 'India',
  MYS: 'Malaysia',
  USA: 'United States',
  TUR: 'Turkey',
  DEU: 'Germany',
  IDN: 'Indonesia',
};

// Map header string to canonical field name based on priority rules
export function mapHeaderToField(headerStr: string): string | null {
  if (!headerStr) return null;
  const h = headerStr.trim().toLowerCase();

  // Explicitly ignore columns that must be recalculated
  if (
    h.includes('total lt') ||
    h === 'requirement' ||
    h === 'rol' ||
    h.includes('reorder level')
  ) {
    return null;
  }

  // Priority order matching rules:
  // 1. contains "material" -> material
  if (h.includes('material')) {
    return 'material';
  }
  // 2. equals "code" -> code
  if (h === 'code' || h.includes('item code') || h.includes('mat code')) {
    return 'code';
  }
  // 3. equals "supplier" -> supplier
  if (h.includes('supplier') || h.includes('vendor')) {
    return 'supplier';
  }
  // 4. contains "monthly" -> monthlyAvg
  if (h.includes('monthly')) {
    return 'monthlyAvg';
  }
  // 5. contains "bal" AND "qty" (or "balance") -> balQty
  if ((h.includes('bal') && h.includes('qty')) || h.includes('balance') || h.includes('stock on hand')) {
    return 'balQty';
  }
  // 6. contains "30 day" -> cons30
  if (h.includes('30 day') || h.includes('30-day') || h.includes('30days') || h.includes('consumption')) {
    return 'cons30';
  }
  // 7. contains "order processing" -> ep
  if (h.includes('order processing') || h.includes('ep order')) {
    return 'ep';
  }
  // 8. contains "supplier manufacturing" or ("manufacturing" AND "lt") -> sml
  if (h.includes('supplier manufacturing') || (h.includes('manufacturing') && h.includes('lt')) || h.includes('mfg lt')) {
    return 'sml';
  }
  // 9. contains "preparation" -> spl
  if (h.includes('preparation') || h.includes('up to etd') || h.includes('shipment prep')) {
    return 'spl';
  }
  // 10. contains "shipment tt" or "etd to eta" -> stt
  if (h.includes('shipment tt') || h.includes('etd to eta') || h.includes('transit time') || h.includes('sea tt')) {
    return 'stt';
  }
  // 11. contains "clearance" -> cl
  if (h.includes('clearance') || h.includes('logistics') || h.includes('customs')) {
    return 'cl';
  }
  // 12. contains "incoming" -> sil
  if (h.includes('incoming') || h.includes('plant inward') || h.includes('grn lt')) {
    return 'sil';
  }
  // 13. contains "safety stock" -> safetyStock
  if (h.includes('safety stock') || h.includes('moq') || h.includes('buffer stock')) {
    return 'safetyStock';
  }
  // 14. contains "confirmed" -> allocConfirmed
  if (h.includes('confirmed')) {
    return 'allocConfirmed';
  }
  // 15. contains "projection" -> allocProjection
  if (h.includes('projection')) {
    return 'allocProjection';
  }
  // 16. contains "comment" -> comments
  if (h.includes('comment') || h.includes('remark') || h.includes('notes')) {
    return 'comments';
  }

  return null;
}

function parseNumber(val: unknown, fallback = 0): number {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const clean = String(val).replace(/,/g, '').trim();
  const num = parseFloat(clean);
  return isNaN(num) ? fallback : num;
}

export function parseMaterialString(material: unknown) {
  const cleanMat = String(material || '').trim();
  const tokens = cleanMat.split(/[_/\s-]+/).filter(Boolean);

  // Category: first token
  const firstToken = tokens[0]?.toUpperCase() || 'OTHER';
  let category: YarnCategory = 'OTHER';
  if (firstToken.includes('DTY')) category = 'DTY';
  else if (firstToken.includes('SPANDEX')) category = 'SPANDEX';
  else if (firstToken.includes('FDY')) category = 'FDY';
  else if (firstToken.includes('LATEX')) category = 'LATEX';

  // Country: trailing 3-letter code /_([A-Z]{3})$/
  const countryMatch = cleanMat.match(/_([A-Za-z]{3})$/);
  const countryCode = countryMatch ? countryMatch[1].toUpperCase() : 'UNKNOWN';
  const country = COUNTRY_LOOKUP[countryCode] || (countryCode !== 'UNKNOWN' ? countryCode : 'Unknown');

  // Spec attributes parsing
  let denier = '-';
  let filament = '-';
  let twistOrLuster = '-';
  let color = '-';

  for (const token of tokens) {
    const tUpper = token.toUpperCase();
    if (tUpper === firstToken || tUpper === countryCode) continue;

    // Denier (e.g. 70D, 140D, 40#, 150D)
    if (/^\d+[D|d|#]$/.test(tUpper) || /^\d+DEN$/i.test(tUpper)) {
      denier = tUpper;
    }
    // Filament (e.g. 36F, 72F, 48F)
    else if (/^\d+[F|f]$/.test(tUpper)) {
      filament = tUpper;
    }
    // Twist / Luster (e.g. RW, SD, FD, S-TWIST, Z-TWIST, BRT)
    else if (/^(RW|SD|FD|BRT|DULL|STWIST|ZTWIST|S|Z|SEMI-DULL|RAW-WHITE)$/.test(tUpper)) {
      twistOrLuster = tUpper;
    }
    // Color (e.g. WHITE, BLACK, CLEAR, GREY, RED)
    else if (/^(WHITE|BLACK|CLEAR|GREY|GRAY|NATURAL|OPTICAL|RED|BLUE|RAW)$/.test(tUpper)) {
      color = tUpper;
    }
  }

  return {
    category,
    country,
    countryCode,
    attributes: {
      denier,
      filament,
      twistOrLuster,
      color,
    },
  };
}

export function computeYarnItem(raw: Record<string, unknown> | Partial<YarnItem>, index: number): YarnItem {
  const codeRaw = raw.code !== undefined && raw.code !== null && raw.code !== ''
    ? String(raw.code).trim()
    : `YARN-${1000 + index}`;
  const id = `${codeRaw}-${index}`;
  const supplier = raw.supplier !== undefined && raw.supplier !== null && raw.supplier !== ''
    ? String(raw.supplier).trim()
    : 'Unassigned Supplier';
  const code = codeRaw;
  const material = raw.material !== undefined && raw.material !== null && raw.material !== ''
    ? String(raw.material).trim()
    : 'RAW_YARN_UNKNOWN';

  const monthlyAvg = parseNumber(raw.monthlyAvg, 0);
  const balQty = parseNumber(raw.balQty, 0);
  const cons30 = parseNumber(raw.cons30, monthlyAvg);

  const ep = parseNumber(raw.ep, 0);
  const sml = parseNumber(raw.sml, 0);
  const spl = parseNumber(raw.spl, 0);
  const stt = parseNumber(raw.stt, 0);
  const cl = parseNumber(raw.cl, 0);
  const sil = parseNumber(raw.sil, 0);

  const safetyStock = raw.safetyStock !== undefined && raw.safetyStock !== null && String(raw.safetyStock).trim() !== ''
    ? parseNumber(raw.safetyStock, 500)
    : 500;

  const allocConfirmed = parseNumber(raw.allocConfirmed, 0);
  const allocProjection = parseNumber(raw.allocProjection, 0);
  const comments = raw.comments !== undefined && raw.comments !== null ? String(raw.comments).trim() : '';

  // DERIVED CALCULATIONS:
  // totalLT = ep + sml + spl + stt + cl + sil
  const totalLT = ep + sml + spl + stt + cl + sil;

  // dailyCons = cons30 / 30 (fallback to monthlyAvg / 30 if cons30 missing)
  const baseCons = cons30 > 0 ? cons30 : monthlyAvg;
  const dailyCons = baseCons > 0 ? baseCons / 30 : 0;

  // requirement = dailyCons * totalLT
  const requirement = Math.round(dailyCons * totalLT * 100) / 100;

  // rol = requirement + safetyStock
  const rol = Math.round((requirement + safetyStock) * 100) / 100;

  // allocTotal = allocConfirmed + allocProjection
  const allocTotal = allocConfirmed + allocProjection;

  // netAvailable = balQty - allocTotal
  const netAvailable = Math.round((balQty - allocTotal) * 100) / 100;

  // suggestedPO = max(0, rol - netAvailable)
  const suggestedPO = Math.max(0, Math.round((rol - netAvailable) * 100) / 100);

  // daysCover = dailyCons > 0 ? balQty / dailyCons : null
  const daysCover = dailyCons > 0 ? Math.round((balQty / dailyCons) * 10) / 10 : null;

  // status:
  // "Critical" if netAvailable <= 0
  // "Reorder Needed" if 0 < netAvailable < rol
  // "Healthy" if netAvailable >= rol
  let status: YarnStatus = 'Healthy';
  if (netAvailable <= 0) {
    status = 'Critical';
  } else if (netAvailable < rol) {
    status = 'Reorder Needed';
  } else {
    status = 'Healthy';
  }

  const { category, country, countryCode, attributes } = parseMaterialString(material);

  return {
    id,
    supplier,
    code,
    material,
    monthlyAvg,
    balQty,
    cons30,
    ep,
    sml,
    spl,
    stt,
    cl,
    sil,
    safetyStock,
    allocConfirmed,
    allocProjection,
    comments,
    totalLT,
    dailyCons,
    requirement,
    rol,
    allocTotal,
    netAvailable,
    suggestedPO,
    daysCover,
    status,
    category,
    country,
    countryCode,
    attributes,
  };
}

export interface ParseResult {
  success: boolean;
  data: YarnItem[];
  error?: string;
  matchedColumns: Record<string, string>;
  unmatchedHeaders: string[];
}

export async function parseYarnAllocationFile(file: File): Promise<ParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        data: [],
        error: 'The uploaded Excel/CSV file contains no sheets.',
        matchedColumns: {},
        unmatchedHeaders: [],
      };
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Read raw data as 2D array
    const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1, defval: '' });

    if (!rows || rows.length < 2) {
      return {
        success: false,
        data: [],
        error: 'The uploaded file has no data rows (must have 1 header row and at least 1 data row).',
        matchedColumns: {},
        unmatchedHeaders: [],
      };
    }

    // Find header row (usually row 0, or first row with text)
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(rows.length, 5); i++) {
      const row = rows[i] as unknown[];
      const strCount = row.filter((c) => typeof c === 'string' && c.trim().length > 0).length;
      if (strCount >= 3) {
        headerRowIndex = i;
        break;
      }
    }

    const rawHeaders = (rows[headerRowIndex] as unknown[]).map((c) => String(c || '').trim());
    const matchedColumns: Record<string, string> = {};
    const columnIndexToField: Record<number, string> = {};
    const unmatchedHeaders: string[] = [];

    rawHeaders.forEach((header, colIdx) => {
      if (!header) return;
      const field = mapHeaderToField(header);
      if (field && !matchedColumns[field]) {
        matchedColumns[field] = header;
        columnIndexToField[colIdx] = field;
      } else if (!field) {
        unmatchedHeaders.push(header);
      }
    });

    // Check mandatory columns: material or code must exist
    if (!matchedColumns['material'] && !matchedColumns['code']) {
      return {
        success: false,
        data: [],
        error: `Could not identify required columns. Expected at least a "Material" or "Code" header. Found columns: ${rawHeaders.filter(Boolean).slice(0, 8).join(', ')}...`,
        matchedColumns,
        unmatchedHeaders,
      };
    }

    const items: YarnItem[] = [];
    for (let r = headerRowIndex + 1; r < rows.length; r++) {
      const row = rows[r] as unknown[];
      if (!row || row.length === 0) continue;

      const rawItem: Record<string, unknown> = {};
      let hasData = false;

      row.forEach((cellVal, colIdx) => {
        const field = columnIndexToField[colIdx];
        if (field) {
          rawItem[field] = cellVal;
          if (cellVal !== '' && cellVal !== null && cellVal !== undefined) {
            hasData = true;
          }
        }
      });

      // Skip completely empty or summary footer rows (e.g. "Total", "Grand Total")
      if (!hasData) continue;
      const matStr = String(rawItem.material || rawItem.code || rawItem.supplier || '').toLowerCase();
      if (matStr.includes('grand total') || matStr.includes('sum') || (matStr === 'total' && !rawItem.code)) {
        continue;
      }

      const yarnItem = computeYarnItem(rawItem, items.length + 1);
      items.push(yarnItem);
    }

    if (items.length === 0) {
      return {
        success: false,
        data: [],
        error: 'No valid yarn allocation records found after parsing the sheet.',
        matchedColumns,
        unmatchedHeaders,
      };
    }

    return {
      success: true,
      data: items,
      matchedColumns,
      unmatchedHeaders,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown parsing error';
    return {
      success: false,
      data: [],
      error: `Failed to parse file: ${message}`,
      matchedColumns: {},
      unmatchedHeaders: [],
    };
  }
}
