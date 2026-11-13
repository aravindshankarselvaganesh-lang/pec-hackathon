import {
  CreateOrderInput,
  CreateWalkInOrderInput,
  CustomerOrder,
  FeasibilityStatus,
  KitchenStationSnapshot,
  MenuCategory,
  MenuItem,
  OrderStatus,
  OrderType,
  Restaurant,
  StationId,
} from '@/domain/types';
import { RestaurantApi } from './restaurant-api';
import { supabase } from '@/lib/supabase/client';
import { formatTimeHHMM } from '@/domain/formatters';

interface SupabaseLineItemRow {
  id?: string;
  order_id?: string;
  menu_item_id?: string;
  name: string;
  price: number | string;
  quantity: number;
  preparation_time_minutes: number;
  station_id: StationId;
  notes?: string;
}

interface SupabaseStatusHistoryRow {
  id?: string;
  order_id?: string;
  status: OrderStatus;
  timestamp: string;
  note?: string;
}

interface SupabaseOrderRow {
  id: string;
  order_token: string;
  order_type: OrderType;
  customer_name: string;
  customer_phone?: string;
  table_number?: string;
  subtotal: number | string;
  tax: number | string;
  total: number | string;
  requested_deadline: string;
  estimated_ready_time: string;
  status: OrderStatus;
  is_walk_in?: boolean;
  created_at: string;
  updated_at: string;
  feasibility_snapshot?: FeasibilityStatus;
  notes?: string;
  order_line_items?: SupabaseLineItemRow[];
  order_status_history?: SupabaseStatusHistoryRow[];
}

export class SupabaseRestaurantApi implements RestaurantApi {
  async getRestaurant(): Promise<Restaurant> {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to load restaurant from Supabase: ${error.message} (${error.code || 'UNKNOWN'})`);
    }

    if (!data) {
      throw new Error('No restaurant profile configured in Supabase. Please ensure migrations/seed.sql has been executed.');
    }

    return {
      id: data.id || 'r1',
      name: data.name || 'RushLess Kitchen',
      descriptor: data.descriptor || 'Campus Food Hall',
      tagline: data.tagline || 'Fresh food, timed to your break.',
      address: data.address || '',
      neighbourhood: data.neighbourhood || '',
      phone: data.phone || '',
      currency: data.currency || '₹',
      taxRatePercent: typeof data.tax_rate_percent === 'number' ? data.tax_rate_percent : Number(data.tax_rate_percent ?? 5),
      defaultBufferMinutes: typeof data.default_buffer_minutes === 'number' ? data.default_buffer_minutes : Number(data.default_buffer_minutes ?? 3),
      isDemoOpen: data.is_open === undefined || data.is_open === null ? true : Boolean(data.is_open),
    };
  }

  async getMenu(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to load menu items from Supabase: ${error.message} (${error.code || 'UNKNOWN'})`);
    }

    if (!data || data.length === 0) {
      throw new Error('Menu items table in Supabase is empty or unpopulated.');
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name || 'Unnamed Item',
      description: item.description || '',
      categoryId: item.category_id || '',
      price: Number(item.price ?? 0),
      preparationTimeMinutes: Number(item.preparation_time_minutes ?? 5),
      stationId: item.station_id || 'STATION_BEVERAGE',
      isAvailable: item.is_available === undefined || item.is_available === null ? true : Boolean(item.is_available),
      image: item.image_url || '',
      dietary: item.dietary || 'VEG',
      isPopular: Boolean(item.is_popular),
      chefPick: Boolean(item.chef_pick),
      fastPrep: Boolean(item.fast_prep),
      fastPrepBadge: item.fast_prep_badge || undefined,
      portionNote: item.portion_note || undefined,
      spiceLevel: item.spice_level || undefined,
      allergens: Array.isArray(item.allergens) ? item.allergens : [],
      alternativeItemIds: Array.isArray(item.alternative_item_ids) ? item.alternative_item_ids : [],
    }));
  }

  async getCategories(): Promise<MenuCategory[]> {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .order('display_order');

    if (error) {
      throw new Error(`Failed to load menu categories from Supabase: ${error.message} (${error.code || 'UNKNOWN'})`);
    }

    if (!data || data.length === 0) {
      throw new Error('Menu categories table in Supabase is empty or unpopulated.');
    }

    return data.map((cat) => ({
      id: cat.id,
      name: cat.name || 'Category',
      displayOrder: Number(cat.display_order ?? 0),
      description: cat.description || '',
      iconName: cat.icon_name || undefined,
    }));
  }

  async getKitchenSnapshot(): Promise<KitchenStationSnapshot[]> {
    const { data, error } = await supabase
      .from('kitchen_stations')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to load kitchen stations from Supabase: ${error.message} (${error.code || 'UNKNOWN'})`);
    }

    if (!data || data.length === 0) {
      throw new Error('Kitchen stations table in Supabase is empty or unpopulated.');
    }

    return data.map((station) => ({
      stationId: station.id,
      stationName: station.name || 'Station',
      totalCapacity: Number(station.capacity_slots ?? 10),
      activeLoad: Number(station.active_load ?? 0),
      queueCount: Number(station.queue_count ?? 0),
      currentWaitMinutes: Number(station.current_wait_minutes ?? 0),
      status: station.status || 'CALM',
    }));
  }

  async getOrders(): Promise<CustomerOrder[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_line_items (*),
        order_status_history (*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load orders from Supabase: ${error.message} (${error.code || 'UNKNOWN'})`);
    }

    if (!data) return [];

    return data.map((order) => this.mapOrder(order));
  }

  async getOrder(id: string): Promise<CustomerOrder | null> {
    if (!id || typeof id !== 'string') return null;

    const isToken = id.toUpperCase().startsWith('RL-');
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_line_items (*),
        order_status_history (*)
      `);

    if (isToken) {
      query = query.ilike('order_token', id);
    } else {
      query = query.eq('id', id);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.warn(`[RushLess] Supabase getOrder query warning for id "${id}":`, error.message);
      return null;
    }

    if (!data) {
      return null;
    }

    return this.mapOrder(data);
  }

  async createDemoOrder(input: CreateOrderInput): Promise<CustomerOrder> {
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const token = `RL-${randomSeq}`;
    const orderId = `ord-${token.toLowerCase()}-${Date.now().toString().slice(-4)}`;

    let menu: MenuItem[] = [];
    try {
      menu = await this.getMenu();
    } catch (err) {
      console.warn('[RushLess] Warning: Failed to query menu for prep times during order creation:', err);
    }

    const lineItems = input.items.map((it) => {
      const menuItem = menu.find((m) => m.id === it.itemId);
      return {
        order_id: orderId,
        menu_item_id: menuItem?.id || it.itemId,
        name: menuItem?.name || 'Item',
        price: menuItem?.price ?? 99,
        quantity: it.quantity,
        preparation_time_minutes: menuItem?.preparationTimeMinutes ?? 5,
        station_id: menuItem?.stationId || ('STATION_BEVERAGE' as StationId),
        notes: it.notes,
      };
    });

    const subtotal = lineItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax;

    const maxPrep = Math.max(...lineItems.map((l) => l.preparation_time_minutes), 5);
    const estReady = new Date(Date.now() + (maxPrep + 5) * 60000);
    const estReadyStr = formatTimeHHMM(estReady);

    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        order_token: token,
        order_type: input.orderType,
        customer_name: input.customerName || 'Customer',
        customer_phone: input.customerPhone,
        table_number: input.tableNumber,
        subtotal,
        tax,
        total,
        requested_deadline: input.requestedDeadline,
        estimated_ready_time: estReadyStr,
        status: 'PENDING',
        is_walk_in: false,
        feasibility_snapshot: 'FEASIBLE',
        notes: input.notes,
      });

    if (orderError) {
      throw new Error(`Failed to create order in Supabase: ${orderError.message}`);
    }

    if (lineItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('order_line_items')
        .insert(lineItems);

      if (itemsError) {
        console.warn('[RushLess] Warning: Failed to insert line items in Supabase:', itemsError.message);
      }
    }

    // Insert initial status history record
    try {
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        status: 'PENDING',
        note: 'Order placed by customer',
      });
    } catch (e) {
      console.warn('[RushLess] Warning: Failed to log initial status history:', e);
    }

    // Try re-fetching order from database
    const created = await this.getOrder(orderId);
    if (created) return created;

    // Resilient in-memory fallback if immediate re-fetch fails due to replication lag
    return {
      id: orderId,
      orderToken: token,
      orderType: input.orderType,
      customerName: input.customerName || 'Customer',
      customerPhone: input.customerPhone,
      tableNumber: input.tableNumber,
      lineItems: lineItems.map((l) => ({
        itemId: l.menu_item_id,
        name: l.name,
        price: l.price,
        quantity: l.quantity,
        preparationTimeMinutes: l.preparation_time_minutes,
        stationId: l.station_id,
        notes: l.notes,
      })),
      subtotal,
      tax,
      total,
      requestedDeadline: input.requestedDeadline,
      estimatedReadyTime: estReadyStr,
      status: 'PENDING',
      isWalkIn: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'PENDING',
          timestamp: new Date().toISOString(),
          note: 'Order placed by customer',
        },
      ],
      feasibilitySnapshot: 'FEASIBLE',
      notes: input.notes,
    };
  }

  async createWalkInOrder(input: CreateWalkInOrderInput): Promise<CustomerOrder> {
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const token = `RL-${randomSeq}`;
    const orderId = `ord-${token.toLowerCase()}-${Date.now().toString().slice(-4)}`;

    let menu: MenuItem[] = [];
    try {
      menu = await this.getMenu();
    } catch (err) {
      console.warn('[RushLess] Warning: Failed to query menu for prep times during walk-in order:', err);
    }

    const lineItems = input.items.map((it) => {
      const menuItem = menu.find((m) => m.id === it.itemId);
      return {
        order_id: orderId,
        menu_item_id: menuItem?.id || it.itemId,
        name: menuItem?.name || 'Walk-in Item',
        price: menuItem?.price ?? 99,
        quantity: it.quantity,
        preparation_time_minutes: menuItem?.preparationTimeMinutes ?? 5,
        station_id: menuItem?.stationId || ('STATION_BEVERAGE' as StationId),
      };
    });

    const subtotal = lineItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax;

    const maxPrep = Math.max(...lineItems.map((l) => l.preparation_time_minutes), 5);
    const estReady = new Date(Date.now() + (maxPrep + 3) * 60000);
    const estReadyStr = formatTimeHHMM(estReady);

    const { error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        order_token: token,
        order_type: input.orderType,
        customer_name: input.customerName || 'Walk-in Counter Guest',
        table_number: input.tableNumber,
        subtotal,
        tax,
        total,
        requested_deadline: input.requestedDeadline || estReadyStr,
        estimated_ready_time: estReadyStr,
        status: 'ACCEPTED',
        is_walk_in: true,
        feasibility_snapshot: 'FEASIBLE',
        notes: input.notes,
      });

    if (orderError) {
      throw new Error(`Failed to create walk-in order in Supabase: ${orderError.message}`);
    }

    if (lineItems.length > 0) {
      const { error: itemsError } = await supabase.from('order_line_items').insert(lineItems);
      if (itemsError) {
        console.warn('[RushLess] Warning: Failed to insert walk-in line items:', itemsError.message);
      }
    }

    // Insert initial status history record
    try {
      await supabase.from('order_status_history').insert({
        order_id: orderId,
        status: 'ACCEPTED',
        note: 'Walk-in order accepted at counter',
      });
    } catch (e) {
      console.warn('[RushLess] Warning: Failed to log initial walk-in status history:', e);
    }

    const created = await this.getOrder(orderId);
    if (created) return created;

    return {
      id: orderId,
      orderToken: token,
      orderType: input.orderType,
      customerName: input.customerName || 'Walk-in Counter Guest',
      tableNumber: input.tableNumber,
      lineItems: lineItems.map((l) => ({
        itemId: l.menu_item_id,
        name: l.name,
        price: l.price,
        quantity: l.quantity,
        preparationTimeMinutes: l.preparation_time_minutes,
        stationId: l.station_id,
      })),
      subtotal,
      tax,
      total,
      requestedDeadline: input.requestedDeadline || estReadyStr,
      estimatedReadyTime: estReadyStr,
      status: 'ACCEPTED',
      isWalkIn: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'ACCEPTED',
          timestamp: new Date().toISOString(),
          note: 'Walk-in order accepted at counter',
        },
      ],
      feasibilitySnapshot: 'FEASIBLE',
      notes: input.notes,
    };
  }

  async updateDemoOrderStatus(id: string, status: OrderStatus, note?: string): Promise<CustomerOrder> {
    const isToken = id.toUpperCase().startsWith('RL-');
    let updateQuery = supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() });

    if (isToken) {
      updateQuery = updateQuery.ilike('order_token', id);
    } else {
      updateQuery = updateQuery.eq('id', id);
    }

    const { error } = await updateQuery;
    if (error) {
      throw new Error(`Failed to update order status in Supabase: ${error.message}`);
    }

    const order = await this.getOrder(id);
    if (order && note) {
      try {
        await supabase.from('order_status_history').insert({
          order_id: order.id,
          status,
          note,
        });
      } catch (err) {
        console.warn('[RushLess] Warning: Failed to append order status history:', err);
      }
    }

    const updated = await this.getOrder(id);
    if (updated) return updated;

    if (order) {
      return {
        ...order,
        status,
        updatedAt: new Date().toISOString(),
      };
    }

    throw new Error(`Order ${id} could not be retrieved after status update`);
  }

  async updateMenuAvailability(itemId: string, available: boolean): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ is_available: available, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to update menu item in Supabase: ${error.message}`);
    }

    if (!data) {
      throw new Error(`Menu item ${itemId} not found in Supabase`);
    }

    return {
      id: data.id,
      name: data.name || 'Item',
      description: data.description || '',
      categoryId: data.category_id || '',
      price: Number(data.price ?? 0),
      preparationTimeMinutes: Number(data.preparation_time_minutes ?? 5),
      stationId: data.station_id || 'STATION_BEVERAGE',
      isAvailable: Boolean(data.is_available),
      image: data.image_url || '',
      dietary: data.dietary || 'VEG',
      isPopular: Boolean(data.is_popular),
      chefPick: Boolean(data.chef_pick),
      fastPrep: Boolean(data.fast_prep),
      fastPrepBadge: data.fast_prep_badge || undefined,
      portionNote: data.portion_note || undefined,
      spiceLevel: data.spice_level || undefined,
      allergens: Array.isArray(data.allergens) ? data.allergens : [],
      alternativeItemIds: Array.isArray(data.alternative_item_ids) ? data.alternative_item_ids : [],
    };
  }

  async resetDemoData(): Promise<void> {
    // In production Supabase, data reset is handled via admin procedures or migrations
  }

  private mapOrder(row: any): CustomerOrder {
    if (!row || typeof row !== 'object') {
      throw new Error('Invalid order row data received from Supabase');
    }

    // Defensive handling of line items relation
    const rawLineItems = Array.isArray(row.order_line_items) ? row.order_line_items : [];
    const lineItems = rawLineItems
      .filter((l: any) => l && typeof l === 'object')
      .map((l: any) => ({
        itemId: l.menu_item_id || l.id || 'unknown-item',
        name: l.name || 'Unnamed item',
        price: Number(l.price ?? 0),
        quantity: Number(l.quantity ?? 1),
        preparationTimeMinutes: Number(l.preparation_time_minutes ?? 5),
        stationId: (l.station_id || 'STATION_BEVERAGE') as StationId,
        notes: l.notes || undefined,
      }));

    // Defensive handling of status history relation
    const rawHistory = Array.isArray(row.order_status_history) ? row.order_status_history : [];
    const statusHistory = [...rawHistory]
      .filter((h: any) => h && typeof h === 'object')
      .sort((a: any, b: any) => {
        const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return timeA - timeB;
      })
      .map((h: any) => ({
        status: (h.status || 'PENDING') as OrderStatus,
        timestamp: h.timestamp || row.created_at || new Date().toISOString(),
        note: h.note || '',
      }));

    // If statusHistory is empty, synthesize initial entry based on order status and created_at
    if (statusHistory.length === 0) {
      statusHistory.push({
        status: (row.status as OrderStatus) || 'PENDING',
        timestamp: row.created_at || new Date().toISOString(),
        note: 'Order initiated',
      });
    }

    return {
      id: String(row.id || ''),
      orderToken: String(row.order_token || 'RL-000'),
      orderType: (row.order_type as OrderType) || 'TAKEAWAY',
      customerName: String(row.customer_name || 'Guest'),
      customerPhone: row.customer_phone ? String(row.customer_phone) : undefined,
      tableNumber: row.table_number ? String(row.table_number) : undefined,
      lineItems,
      subtotal: Number(row.subtotal ?? 0),
      tax: Number(row.tax ?? 0),
      total: Number(row.total ?? 0),
      requestedDeadline: String(row.requested_deadline || ''),
      estimatedReadyTime: String(row.estimated_ready_time || ''),
      status: (row.status as OrderStatus) || 'PENDING',
      isWalkIn: Boolean(row.is_walk_in),
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
      statusHistory,
      feasibilitySnapshot: (row.feasibility_snapshot as FeasibilityStatus) || 'FEASIBLE',
      notes: row.notes ? String(row.notes) : undefined,
    };
  }
}

export const supabaseRestaurantApi = new SupabaseRestaurantApi();
