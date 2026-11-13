import {
  CreateOrderInput,
  CreateWalkInOrderInput,
  CustomerOrder,
  KitchenStationSnapshot,
  MenuCategory,
  MenuItem,
  OrderStatus,
  Restaurant,
} from '@/domain/types';
import { RestaurantApi } from './restaurant-api';
import { DEMO_CATEGORIES, DEMO_MENU_ITEMS, DEMO_RESTAURANT } from '@/data/demo-menu';
import { INITIAL_KITCHEN_SNAPSHOTS } from '@/data/demo-kitchen';
import { INITIAL_DEMO_ORDERS } from '@/data/demo-orders';
import { formatTimeHHMM, parseTimeToTodayDate } from '@/domain/formatters';

const STORAGE_KEYS = {
  MENU: 'rushless_v3_universal_menu',
  ORDERS: 'rushless_v3_universal_orders',
  KITCHEN: 'rushless_v3_universal_kitchen',
  TOKEN_SEQ: 'rushless_v3_universal_token_seq',
};

class MockRestaurantApi implements RestaurantApi {
  private restaurant: Restaurant = { ...DEMO_RESTAURANT };
  private menu: MenuItem[] = [...DEMO_MENU_ITEMS];
  private categories: MenuCategory[] = [...DEMO_CATEGORIES];
  private orders: CustomerOrder[] = [...INITIAL_DEMO_ORDERS];
  private kitchenSnapshots: KitchenStationSnapshot[] = [...INITIAL_KITCHEN_SNAPSHOTS];
  private tokenSeq = 25;

  constructor() {
    this.hydrateFromStorage();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  private hydrateFromStorage(): void {
    if (!this.isBrowser()) return;
    try {
      const storedMenu = localStorage.getItem(STORAGE_KEYS.MENU);
      if (storedMenu) this.menu = JSON.parse(storedMenu);

      const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (storedOrders) this.orders = JSON.parse(storedOrders);

      const storedKitchen = localStorage.getItem(STORAGE_KEYS.KITCHEN);
      if (storedKitchen) this.kitchenSnapshots = JSON.parse(storedKitchen);

      const storedSeq = localStorage.getItem(STORAGE_KEYS.TOKEN_SEQ);
      if (storedSeq) this.tokenSeq = parseInt(storedSeq, 10);
    } catch {
      // Fallback silently to initial in-memory seed
    }
  }

  private saveToStorage(): void {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(STORAGE_KEYS.MENU, JSON.stringify(this.menu));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.orders));
      localStorage.setItem(STORAGE_KEYS.KITCHEN, JSON.stringify(this.kitchenSnapshots));
      localStorage.setItem(STORAGE_KEYS.TOKEN_SEQ, this.tokenSeq.toString());
    } catch {
      // Ignore localStorage quotas / private browsing errors
    }
  }

  async getRestaurant(): Promise<Restaurant> {
    return { ...this.restaurant };
  }

  async getMenu(): Promise<MenuItem[]> {
    return [...this.menu];
  }

  async getCategories(): Promise<MenuCategory[]> {
    return [...this.categories];
  }

  async getKitchenSnapshot(): Promise<KitchenStationSnapshot[]> {
    return [...this.kitchenSnapshots];
  }

  async getOrders(): Promise<CustomerOrder[]> {
    return [...this.orders];
  }

  async getOrder(id: string): Promise<CustomerOrder | null> {
    const found = this.orders.find((o) => o.id === id || o.orderToken.toLowerCase() === id.toLowerCase());
    return found ? { ...found } : null;
  }

  async createDemoOrder(input: CreateOrderInput): Promise<CustomerOrder> {
    const token = `RL-${this.tokenSeq.toString().padStart(3, '0')}`;
    this.tokenSeq += 1;

    const lineItems = input.items.map((it) => {
      const menuItem = this.menu.find((m) => m.id === it.itemId);
      if (!menuItem) {
        throw new Error(`Menu item not found: ${it.itemId}`);
      }
      return {
        itemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: it.quantity,
        preparationTimeMinutes: menuItem.preparationTimeMinutes,
        stationId: menuItem.stationId,
        notes: it.notes,
      };
    });

    const subtotal = lineItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    const tax = Math.round(subtotal * (this.restaurant.taxRatePercent / 100));
    const total = subtotal + tax;

    // Estimate ready time (simulate 10-15 min default based on items)
    const maxItemPrep = Math.max(...lineItems.map((l) => l.preparationTimeMinutes), 5);
    const estimatedPrepTotal = maxItemPrep + this.restaurant.defaultBufferMinutes + 2;
    const estReady = new Date(Date.now() + estimatedPrepTotal * 60000);

    const nowIso = new Date().toISOString();
    const newOrder: CustomerOrder = {
      id: `ord-${token.toLowerCase()}`,
      orderToken: token,
      orderType: input.orderType,
      customerName: input.customerName || 'Customer',
      customerPhone: input.customerPhone,
      tableNumber: input.tableNumber,
      lineItems,
      subtotal,
      tax,
      total,
      requestedDeadline: input.requestedDeadline,
      estimatedReadyTime: formatTimeHHMM(estReady),
      status: 'PENDING',
      isWalkIn: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      statusHistory: [
        {
          status: 'PENDING',
          timestamp: nowIso,
          note: `Demo order placed with requested deadline ${formatTimeHHMM(input.requestedDeadline)}`,
        },
      ],
      feasibilitySnapshot: 'FEASIBLE',
      notes: input.notes,
    };

    this.orders.unshift(newOrder);
    this.adjustKitchenLoad(lineItems, 1);
    this.saveToStorage();
    return { ...newOrder };
  }

  async createWalkInOrder(input: CreateWalkInOrderInput): Promise<CustomerOrder> {
    const token = `RL-${this.tokenSeq.toString().padStart(3, '0')}`;
    this.tokenSeq += 1;

    const lineItems = input.items.map((it) => {
      const menuItem = this.menu.find((m) => m.id === it.itemId);
      if (!menuItem) {
        throw new Error(`Menu item not found: ${it.itemId}`);
      }
      return {
        itemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: it.quantity,
        preparationTimeMinutes: menuItem.preparationTimeMinutes,
        stationId: menuItem.stationId,
      };
    });

    const subtotal = lineItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    const tax = Math.round(subtotal * (this.restaurant.taxRatePercent / 100));
    const total = subtotal + tax;

    const maxItemPrep = Math.max(...lineItems.map((l) => l.preparationTimeMinutes), 5);
    const estReady = new Date(Date.now() + (maxItemPrep + 3) * 60000);
    const nowIso = new Date().toISOString();

    const newOrder: CustomerOrder = {
      id: `ord-${token.toLowerCase()}`,
      orderToken: token,
      orderType: input.orderType,
      customerName: input.customerName || 'Walk-in Counter Guest',
      tableNumber: input.tableNumber,
      lineItems,
      subtotal,
      tax,
      total,
      requestedDeadline: input.requestedDeadline || formatTimeHHMM(estReady),
      estimatedReadyTime: formatTimeHHMM(estReady),
      status: 'ACCEPTED',
      isWalkIn: true,
      createdAt: nowIso,
      updatedAt: nowIso,
      statusHistory: [
        {
          status: 'ACCEPTED',
          timestamp: nowIso,
          note: 'Walk-in counter order entered by staff',
        },
      ],
      feasibilitySnapshot: 'FEASIBLE',
      notes: input.notes,
    };

    this.orders.unshift(newOrder);
    this.adjustKitchenLoad(lineItems, 1);
    this.saveToStorage();
    return { ...newOrder };
  }

  async updateDemoOrderStatus(id: string, status: OrderStatus, note?: string): Promise<CustomerOrder> {
    const index = this.orders.findIndex((o) => o.id === id || o.orderToken === id);
    if (index === -1) {
      throw new Error(`Order ${id} not found.`);
    }

    const order = this.orders[index];
    const prevStatus = order.status;
    const nowIso = new Date().toISOString();

    const statusNote = note || `Status updated from ${prevStatus} to ${status}`;
    const updatedOrder: CustomerOrder = {
      ...order,
      status,
      updatedAt: nowIso,
      statusHistory: [
        ...order.statusHistory,
        {
          status,
          timestamp: nowIso,
          note: statusNote,
        },
      ],
    };

    // If order was completed or cancelled, relieve station active load
    if (status === 'COLLECTED' || status === 'CANCELLED') {
      this.adjustKitchenLoad(order.lineItems, -1);
    }

    this.orders[index] = updatedOrder;
    this.saveToStorage();
    return { ...updatedOrder };
  }

  async updateMenuAvailability(itemId: string, available: boolean): Promise<MenuItem> {
    const item = this.menu.find((m) => m.id === itemId);
    if (!item) {
      throw new Error(`Menu item not found: ${itemId}`);
    }
    item.isAvailable = available;
    this.saveToStorage();
    return { ...item };
  }

  async resetDemoData(): Promise<void> {
    this.menu = [...DEMO_MENU_ITEMS];
    this.orders = [...INITIAL_DEMO_ORDERS];
    this.kitchenSnapshots = [...INITIAL_KITCHEN_SNAPSHOTS];
    this.tokenSeq = 25;
    if (this.isBrowser()) {
      localStorage.removeItem(STORAGE_KEYS.MENU);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.KITCHEN);
      localStorage.removeItem(STORAGE_KEYS.TOKEN_SEQ);
    }
  }

  private adjustKitchenLoad(lineItems: { stationId: string }[], direction: 1 | -1): void {
    const affectedStations = new Set(lineItems.map((l) => l.stationId));
    this.kitchenSnapshots = this.kitchenSnapshots.map((snap) => {
      if (affectedStations.has(snap.stationId)) {
        const newQueue = Math.max(0, snap.queueCount + direction);
        const newWait = Math.max(2, snap.currentWaitMinutes + direction * 2);
        let status: 'CALM' | 'BUSY' | 'PEAK' = 'CALM';
        if (newWait >= 8) status = 'PEAK';
        else if (newWait >= 5) status = 'BUSY';

        return {
          ...snap,
          queueCount: newQueue,
          currentWaitMinutes: newWait,
          status,
        };
      }
      return snap;
    });
  }
}

// Singleton frontend instance
export const mockRestaurantApi = new MockRestaurantApi();
