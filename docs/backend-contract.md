# RushLess — Backend Integration Contract

This contract defines the data models, API endpoints, request/response formats, error codes, and frontend adapter switch points for the **OpenCode backend implementation phase**.

The RushLess frontend is completely built and operates against a typed service interface (`RestaurantApi` in `src/lib/data/restaurant-api.ts`). Currently, `MockRestaurantApi` provides deterministic in-memory demo behavior. During the OpenCode backend phase, this adapter will be replaced with `HttpRestaurantApi` without altering UI components.

---

## 1. Domain Entities & Schemas

### 1.1 Restaurant
```typescript
interface Restaurant {
  id: string;                    // UUID or slug, e.g. "corner-cafe-01"
  name: string;                  // "Corner Café"
  descriptor: string;            // "Time-aware neighbourhood café"
  tagline: string;
  address: string;
  neighbourhood: string;
  phone: string;
  currency: string;              // "₹"
  taxRatePercent: number;        // e.g. 5
  defaultBufferMinutes: number;  // e.g. 3
  isDemoOpen: boolean;
}
```

### 1.2 PreparationStation & KitchenSnapshot
```typescript
type StationId = 'quick-bites' | 'hot-kitchen' | 'fryer' | 'drinks';

interface KitchenStationSnapshot {
  stationId: StationId;
  stationName: string;
  totalCapacity: number;         // Parallel slots
  activeLoad: number;            // Currently occupied slots
  queueCount: number;            // Orders waiting in station queue
  currentWaitMinutes: number;    // Estimated queue wait time
  status: 'CALM' | 'BUSY' | 'PEAK';
}
```

### 1.3 MenuItem
```typescript
interface MenuItem {
  id: string;                    // e.g. "item-veg-sandwich"
  name: string;
  description: string;
  categoryId: string;            // "quick-bites" | "meals" | "fryer" | "drinks"
  price: number;                 // Integer INR, e.g. 60
  preparationTimeMinutes: number;// Base prep time, e.g. 5
  stationId: StationId;          // Station handling this item
  isAvailable: boolean;          // Instant 86 / availability toggle
  image: string;                 // URL to image
  dietary: 'PURE_VEG' | 'VEG' | 'VEGAN' | 'BEVERAGE' | 'JAIN_AVAIL';
  isPopular?: boolean;
  alternativeItemIds?: string[]; // Mapped alternatives for BreakFit substitution
}
```

### 1.4 CustomerOrder & OrderLineItem
```typescript
type OrderType = 'DINE_IN' | 'TAKEAWAY';
type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COLLECTED' | 'CANCELLED';
type FeasibilityStatus = 'FEASIBLE' | 'RISKY' | 'INFEASIBLE' | 'INVALID_DEADLINE' | 'EMPTY';

interface OrderLineItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  preparationTimeMinutes: number;
  stationId: StationId;
  notes?: string;
}

interface CustomerOrder {
  id: string;                    // e.g. "ord-rl-024"
  orderToken: string;            // Short human token, e.g. "RL-024"
  orderType: OrderType;
  customerName: string;
  customerPhone?: string;
  tableNumber?: string;
  lineItems: OrderLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  requestedDeadline: string;     // 24H "HH:MM" e.g. "13:20"
  estimatedReadyTime: string;    // 12H display string or ISO timestamp
  status: OrderStatus;
  isWalkIn: boolean;
  createdAt: string;             // ISO-8601
  updatedAt: string;             // ISO-8601
  statusHistory: {
    status: OrderStatus;
    timestamp: string;
    note: string;
  }[];
  feasibilitySnapshot: FeasibilityStatus;
  notes?: string;
}
```

---

## 2. API Endpoints Specification (`/api/v1`)

All endpoints accept and return `application/json`. Timestamps must be ISO-8601 strings.

### 2.1 GET `/api/v1/restaurant`
Returns restaurant metadata, opening status, and default buffer parameters.
```json
{
  "success": true,
  "data": {
    "id": "corner-cafe-01",
    "name": "Corner Café",
    "descriptor": "Time-aware neighbourhood café",
    "tagline": "Fresh wholesome food timed to your university break",
    "address": "Shop 4, Campus Avenue, Near North Gate",
    "currency": "₹",
    "taxRatePercent": 5,
    "defaultBufferMinutes": 3,
    "isDemoOpen": true
  }
}
```

### 2.2 GET `/api/v1/menu`
Returns all active categories and menu items with station mappings and availability flags.
```json
{
  "success": true,
  "data": {
    "categories": [
      { "id": "quick-bites", "name": "Quick Bites", "displayOrder": 1 }
    ],
    "items": [
      {
        "id": "item-veg-sandwich",
        "name": "Veg Club Sandwich",
        "description": "Crisp cucumber, tomato, mint chutney and cheese slices.",
        "categoryId": "quick-bites",
        "price": 60,
        "preparationTimeMinutes": 5,
        "stationId": "quick-bites",
        "isAvailable": true,
        "dietary": "VEG",
        "alternativeItemIds": ["item-paneer-wrap"]
      }
    ]
  }
}
```

### 2.3 GET `/api/v1/kitchen/snapshot`
Returns the real-time operational load and queue wait times for all kitchen stations.
```json
{
  "success": true,
  "data": [
    {
      "stationId": "quick-bites",
      "stationName": "Quick Bites & Cold Prep",
      "totalCapacity": 3,
      "activeLoad": 1,
      "queueCount": 1,
      "currentWaitMinutes": 4,
      "status": "CALM"
    },
    {
      "stationId": "hot-kitchen",
      "stationName": "Hot Kitchen & Tawa",
      "totalCapacity": 2,
      "activeLoad": 2,
      "queueCount": 3,
      "currentWaitMinutes": 9,
      "status": "PEAK"
    }
  ]
}
```

### 2.4 POST `/api/v1/breakfit/evaluate`
Server-side authoritative evaluation of a candidate basket against live kitchen capacity.
**Request:**
```json
{
  "requestedDeadline": "13:20",
  "items": [
    { "itemId": "item-veg-fried-rice", "quantity": 1 }
  ]
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "feasibility": "INFEASIBLE",
    "statusLabel": "May miss your deadline",
    "requestedDeadline": "13:20",
    "estimatedReadyTime": "1:28 PM",
    "bufferMinutes": 3,
    "totalEstimatedMinutes": 14,
    "bottleneckStation": {
      "stationId": "hot-kitchen",
      "stationName": "Hot Kitchen & Tawa",
      "stationWaitMinutes": 9
    },
    "explanation": "The Hot Kitchen & Tawa has a current queue of 9 min. Estimated ready at 1:28 PM, 8 min past your deadline.",
    "alternativeSuggestions": [
      {
        "originalItemId": "item-veg-fried-rice",
        "suggestedItemId": "item-veg-sandwich",
        "timeSavedMinutes": 7,
        "priceDifference": -40,
        "reason": "Switch to Veg Club Sandwich (5m prep at calmer Quick Bites). Ready ~7 min faster."
      }
    ],
    "suggestedLaterDeadline": "13:30"
  }
}
```

### 2.5 POST `/api/v1/orders`
Creates a customer order.
**Request:**
```json
{
  "orderType": "TAKEAWAY",
  "customerName": "Rohan Verma",
  "customerPhone": "+91 98765 43210",
  "requestedDeadline": "13:25",
  "items": [
    { "itemId": "item-veg-sandwich", "quantity": 1, "notes": "No onions" },
    { "itemId": "item-cold-coffee", "quantity": 1 }
  ]
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "ord-rl-025",
    "orderToken": "RL-025",
    "orderType": "TAKEAWAY",
    "customerName": "Rohan Verma",
    "subtotal": 125,
    "tax": 6,
    "total": 131,
    "requestedDeadline": "13:25",
    "estimatedReadyTime": "1:14 PM",
    "status": "PENDING",
    "isWalkIn": false,
    "createdAt": "2026-11-14T00:30:00.000Z"
  }
}
```

### 2.6 GET `/api/v1/orders/:id`
Retrieves single order status and activity history for customer tracking (`/order/[id]`).
```json
{
  "success": true,
  "data": {
    "id": "ord-rl-025",
    "orderToken": "RL-025",
    "status": "PREPARING",
    "requestedDeadline": "13:25",
    "estimatedReadyTime": "1:14 PM",
    "lineItems": [
      { "name": "Veg Club Sandwich", "quantity": 1, "price": 60 }
    ],
    "statusHistory": [
      { "status": "PENDING", "timestamp": "2026-11-14T00:30:00.000Z", "note": "Order placed" },
      { "status": "PREPARING", "timestamp": "2026-11-14T00:32:00.000Z", "note": "Grilling sandwich" }
    ]
  }
}
```

### 2.7 PATCH `/api/v1/orders/:id/status`
Kitchen staff updates order status (`ACCEPTED` -> `PREPARING` -> `READY` -> `COLLECTED`).
**Request:**
```json
{
  "status": "READY",
  "note": "Assembled on pickup counter"
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "ord-rl-025",
    "status": "READY",
    "updatedAt": "2026-11-14T00:35:00.000Z"
  }
}
```

### 2.8 PATCH `/api/v1/menu/:id/availability`
Kitchen / counter 86 toggle for menu items.
**Request:**
```json
{
  "isAvailable": false
}
```
**Response:**
```json
{
  "success": true,
  "data": {
    "id": "item-veg-fried-rice",
    "isAvailable": false
  }
}
```

---

## 3. Expected Error Codes & Formats

Standard RFC 7807 error format:
```json
{
  "success": false,
  "error": {
    "code": "ITEM_UNAVAILABLE",
    "message": "Item 'item-veg-fried-rice' was marked sold out.",
    "details": { "itemId": "item-veg-fried-rice" }
  }
}
```

| HTTP Status | Error Code | Trigger Condition |
|:---|:---|:---|
| `400 Bad Request` | `INVALID_DEADLINE` | Customer deadline is in the past or under 3 minutes away. |
| `400 Bad Request` | `VALIDATION_ERROR` | Missing required customer name, invalid table number, or empty basket. |
| `404 Not Found` | `ORDER_NOT_FOUND` | Order token does not exist. |
| `409 Conflict` | `ITEM_UNAVAILABLE` | Item selected was toggled off (sold out) prior to order submission. |
| `409 Conflict` | `CAPACITY_EXCEEDED` | Kitchen station reached maximum queue threshold for requested time slot. |
| `500 Server Error` | `INTERNAL_ERROR` | Unhandled backend failure. |

---

## 4. Frontend Adapter Switch Points

In the frontend codebase, **no UI components import raw mock data**. All screens interact exclusively through:

- Interface: `src/lib/data/restaurant-api.ts`
- Current Adapter: `src/lib/data/mock-restaurant-api.ts`

To switch to the real OpenCode backend:
1. Implement `src/lib/data/http-restaurant-api.ts` implementing `RestaurantApi` with standard `fetch()` calls to `/api/v1/*`.
2. In `src/context/restaurant-context.tsx`, swap `mockRestaurantApi` with `httpRestaurantApi` (or toggle via `process.env.NEXT_PUBLIC_USE_MOCK_API === 'true'`).
3. No changes to `page.tsx`, `admin/page.tsx`, `admin/menu/page.tsx`, or any component are required.

---

## 5. Concurrency & Authoritative Scheduling Note

In this frontend prototype, the BreakFit feasibility estimate runs client-side for immediate user feedback. In production OpenCode backend:

1. **Authoritative Slot Reservation:** When an order is confirmed, the backend must execute an atomic check-and-insert transaction on station capacity slots.
2. **Race Prevention:** If two customers submit simultaneously for the last slot in a 12:45–13:00 window, the second transaction must receive `409 CAPACITY_EXCEEDED` and prompt BreakFit alternative suggestions rather than double-booking the station.

---

## 6. Staff Authentication Note

For the frontend prototype, `/admin` routes are accessible via client-side tab navigation without login credentials. In OpenCode:
- Add Session/JWT authentication guard (`/api/v1/auth/login`) protecting `admin/*` and `PATCH /api/v1/orders/*`.
- Customer ordering (`/` and `/order/[id]`) remains unauthenticated for frictionless QR-code ordering.
