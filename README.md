# RushLess — Time-Aware Local Restaurant Ordering

> **Signature Innovation: BreakFit — Deadline-to-Menu Feasibility Engine**  
> Hackathon Track: PS 1 — Digital Empowerment of Local Restaurants

RushLess is a time-aware restaurant ordering system tailored for campus cafés and busy neighborhood eateries. It allows time-constrained students and office workers to specify the latest time they must collect their order. The **BreakFit™** engine evaluates the selected basket against active station workloads and prep profiles, providing transparent feasibility feedback and customer-approved alternatives before orders are confirmed.

---

## Surfaces & Routes

| Route | Surface | Description |
|:---|:---|:---|
| `/` | **Customer Storefront** | Deadline selector ("When do you need your order?"), menu browsing, BreakFit feasibility panel, responsive basket drawer, and demo checkout. |
| `/order/[id]` | **Order Confirmation & Tracker** | Live status tracking (`Accepted` → `Preparing` → `Ready` → `Collected`), pickup tokens, timing breakdown, and simulation fast-forward control. |
| `/admin` | **Restaurant Operations** | Overview metrics, station workload capacity cards, live order queue with deadline-risk indicators, and walk-in counter order entry. |
| `/admin/menu` | **Menu Management** | Immediate availability controls (86 / Sold Out toggle) that instantly sync with customer storefront browsing. |

---

## Architectural Principles

- **Frontend-Only Contract:** All UI components interact through a typed `RestaurantApi` service (`src/lib/data/restaurant-api.ts`). Currently powered by `MockRestaurantApi` (`src/lib/data/mock-restaurant-api.ts`), ready to be swapped with HTTP endpoints in OpenCode.
- **Backend Contract:** Full API specifications, error codes, and JSON payloads documented in [`docs/backend-contract.md`](docs/backend-contract.md).
- **Deterministic Feasibility Engine:** `src/lib/breakfit/estimate.ts` computes station delays, bottleneck constraints, dispatch buffers, and alternative item suggestions without random unpredictability.

---

## Development

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run TypeScript checks & build
npm run build
```
