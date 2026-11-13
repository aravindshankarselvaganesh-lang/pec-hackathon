export type StationId = 'quick-bites' | 'hot-kitchen' | 'fryer' | 'drinks';

export type DietaryType = 'PURE_VEG' | 'VEG' | 'NON_VEG' | 'VEGAN' | 'BEVERAGE' | 'JAIN_AVAIL';

export type OrderType = 'DINE_IN' | 'TAKEAWAY';

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY' | 'COLLECTED' | 'CANCELLED';

export type FeasibilityStatus = 'FEASIBLE' | 'RISKY' | 'INFEASIBLE' | 'INVALID_DEADLINE' | 'EMPTY';

export interface PreparationStation {
  id: StationId;
  name: string;
  capacitySlots: number;
  averageTimeMultiplier: number;
  description: string;
}

export interface KitchenStationSnapshot {
  stationId: StationId;
  stationName: string;
  totalCapacity: number;
  activeLoad: number;
  queueCount: number;
  currentWaitMinutes: number;
  status: 'CALM' | 'BUSY' | 'PEAK';
}

export interface MenuCategory {
  id: string;
  name: string;
  displayOrder: number;
  description: string;
  iconName?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  preparationTimeMinutes: number;
  stationId: StationId;
  isAvailable: boolean;
  image: string;
  dietary: DietaryType;
  isPopular?: boolean;
  alternativeItemIds?: string[];
  calories?: number;
  chefPick?: boolean;
  fastPrep?: boolean;
  fastPrepBadge?: string;
  portionNote?: string;
  spiceLevel?: 'Mild' | 'Medium' | 'Fiery' | 'Sweet';
  allergens?: string[];
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export interface AlternativeSuggestion {
  originalItem: MenuItem;
  suggestedItem: MenuItem;
  timeSavedMinutes: number;
  priceDifference: number; // e.g. -10 or +10
  reason: string;
}

export interface BreakFitResult {
  feasibility: FeasibilityStatus;
  statusLabel: string;
  requestedDeadline: string; // ISO string or HH:MM format
  estimatedReadyTime: string; // ISO string or HH:MM format
  bufferMinutes: number;
  totalEstimatedMinutes: number;
  minutesRemainingToDeadline: number;
  bottleneckStation?: {
    stationId: StationId;
    stationName: string;
    stationWaitMinutes: number;
  };
  explanation: string;
  alternativeSuggestions: AlternativeSuggestion[];
  suggestedLaterDeadline?: string;
  isDemoSimulation: true;
}

export interface OrderLineItem {
  itemId: string;
  name: string;
  price: number;
  quantity: number;
  preparationTimeMinutes: number;
  stationId: StationId;
  notes?: string;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  timestamp: string;
  note: string;
}

export interface CustomerOrder {
  id: string;
  orderToken: string; // e.g. "RL-024"
  orderType: OrderType;
  customerName: string;
  customerPhone?: string;
  tableNumber?: string;
  lineItems: OrderLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  requestedDeadline: string; // formatted HH:MM
  estimatedReadyTime: string; // formatted HH:MM
  status: OrderStatus;
  isWalkIn: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  statusHistory: OrderStatusEvent[];
  feasibilitySnapshot: FeasibilityStatus;
  notes?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  descriptor: string;
  tagline: string;
  address: string;
  neighbourhood: string;
  phone: string;
  currency: string;
  taxRatePercent: number;
  defaultBufferMinutes: number;
  isDemoOpen: boolean;
}

export interface CreateOrderInput {
  orderType: OrderType;
  customerName: string;
  customerPhone?: string;
  tableNumber?: string;
  items: {
    itemId: string;
    quantity: number;
    notes?: string;
  }[];
  requestedDeadline: string;
  notes?: string;
}

export interface CreateWalkInOrderInput {
  orderType: OrderType;
  customerName: string;
  tableNumber?: string;
  items: {
    itemId: string;
    quantity: number;
  }[];
  requestedDeadline?: string;
  notes?: string;
}
