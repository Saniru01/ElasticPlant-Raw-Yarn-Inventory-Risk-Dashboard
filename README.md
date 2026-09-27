# ElasticPlant Raw Yarn Inventory & Risk Executive Dashboard

A corporate executive dashboard designed for supply chain leadership, plant managers, and procurement buyers at elastic manufacturing plants. 

The application parses client-side Excel (`.xlsx`, `.xls`) or `.csv` exports of **"Yarn Allocation"** reports, recomputes derived inventory-risk metrics dynamically in the browser, and delivers five operational and executive perspectives.

No server-side processing, no external database, no latency — 100% of data remains secure within the browser.

---

## Tabbed Views

1. **01 Executive Overview**
   - 10-second read for leadership: plain-language headline quantifying line items needing purchase orders, total volume (kg), and affected suppliers.
   - 6 KPI stat cards (Material lines, Suppliers, Total balance stock, Critical lines, Reorder Needed, Suggested PO volume).
   - Stock Health donut chart with status percentages.
   - Balance Stock vs. Monthly Consumption grouped by yarn category.
   - Sourcing country line count distribution.
   - Priority Purchase Orders table (Top 10 materials by suggested PO volume).

2. **02 Operational / Replenishment**
   - Buyer's working dashboard with sortable data table across all yarn lines.
   - Recomputed columns: Total LT, Requirement for Lead Time, Safety Stock, ROL, Net Available, Suggested PO, and Days of Cover.
   - **Order By Date** scheduler with urgency warnings for lead-time breaches.
   - **Suggested POs Grouped by Supplier** with collapsible vendor order asks.
   - **Stockout Urgency List** ranking materials by lowest days of cover.

3. **03 Supplier & Sourcing Risk**
   - Supplier dependency concentration chart (% share of monthly plant consumption).
   - Geographic origin concentration chart.
   - Lead time by country comparison (identifying structural geographic shipping/clearance disparities).
   - Supplier Risk Scorecard default-sorted by Critical line count descending.

4. **04 Material & Category Insights**
   - Category performance cards (DTY, Spandex, FDY, Latex, Other).
   - Status breakdown stacked bar chart per yarn category.
   - Material attribute table parsing denier (`75D`, `140D`), filament (`36F`, `72F`), luster/twist (`RW`, `SD`, `FD`), and color (`WHITE`, `BLACK`, `CLEAR`).
   - **Supply Continuity & Substitutes Matrix**: Identifies cross-supplier alternative yarn codes sharing matching specs for emergency re-routing.

5. **05 Master Log**
   - Unfiltered full audit data grid containing all original spreadsheet columns plus every computed risk field.
   - Global multi-field search and column-level sorting.
   - Column visibility toggle menu (show/hide columns).
   - Instant client-side **Export to CSV**.

---

## Expected Input File Format

The parser uses smart fuzzy matching on header text to support variations in export naming. The expected column mapping is:

| Canonical Field | Expected Header Substring | Notes |
| :--- | :--- | :--- |
| `material` | Contains `material` | Material code / description (e.g. `DTY_75D_36F_RW_CHN`) |
| `code` | Equals `code` or contains `item code` | Material SKU identifier |
| `supplier` | Contains `supplier` or `vendor` | Vendor name |
| `monthlyAvg` | Contains `monthly` | Monthly average consumption (kg) |
| `balQty` | Contains `bal` AND `qty` or `balance` | Warehouse physical balance (kg) |
| `cons30` | Contains `30 day` or `consumption` | Past 30 days consumption (kg) |
| `ep` | Contains `order processing` | EP order processing LT (days) |
| `sml` | Contains `supplier manufacturing` or `mfg lt` | Supplier manufacturing LT (days) |
| `spl` | Contains `preparation` or `up to etd` | Shipment preparation LT (days) |
| `stt` | Contains `shipment tt` or `etd to eta` | Ocean transit time (days) |
| `cl` | Contains `clearance` or `logistics` | Customs clearance & logistics (days) |
| `sil` | Contains `incoming` or `plant inward` | Plant incoming & GRN inspection (days) |
| `safetyStock` | Contains `safety stock` or `moq` | Safety buffer (default 500 kg if blank) |
| `allocConfirmed` | Contains `confirmed` | Confirmed loom allocations (kg) |
| `allocProjection` | Contains `projection` | Projected order allocations (kg) |
| `comments` | Contains `comment` or `remark` | Buyer/planner notes |

*Note: Any existing `Total LT`, `Requirement`, or `ROL` columns in uploaded files are ignored and recalculated dynamically to avoid stale spreadsheet formulas.*

---

## Mathematical Formulation

$$TotalLT = EP + SML + SPL + STT + CL + SIL$$
$$Cons_{daily} = Cons_{30} / 30$$
$$Requirement = Cons_{daily} \times TotalLT$$
$$ROL = Requirement + SafetyStock_{MOQ}$$
$$Alloc_{total} = Alloc_{confirmed} + Alloc_{projection}$$
$$NetAvailable = BalQty - Alloc_{total}$$
$$SuggestedPO = \max(0, ROL - NetAvailable)$$
$$DaysCover = BalQty / Cons_{daily}$$

### Status Rules
- **Critical**: $NetAvailable \le 0$
- **Reorder Needed**: $0 < NetAvailable < ROL$
- **Healthy**: $NetAvailable \ge ROL$

---

## Local Development & Deployment

### Run Locally
```bash
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### Build for Production (Vercel / Cloud Run)
```bash
npm run build
```
Outputs a static single-page application into `dist/`. Deployable with zero configuration to Vercel, Netlify, or any static hosting service.
