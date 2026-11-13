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
  menu_item_id?: string;
  name: string;
  price: number | string;
  quantity: number;
  preparation_time_minutes: number;
  station_id: StationId;
  notes?: string;
}

interface SupabaseStatusHistoryRow {
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
      .single();

    if (error || !data) {
      throw new Error(`Failed to load restaurant: ${error?.message}`);
    }

    return {
      id: data.id,
      name: data.name,
      descriptor: data.descriptor || 'Campus Food Hall',
      tagline: data.tagline || 'Fresh food, timed to your break.',
      address: data.address || '',
      neighbourhood: data.neighbourhood || '',
      phone: data.phone || '',
      currency: data.currency || '₹',
      taxRatePercent: Number(data.tax_rate_percent ?? 5),
      defaultBufferMinutes: Number(data.default_buffer_minutes ?? 3),
      isDemoOpen: Boolean(data.is_open),
    };
  }

  async getMenu(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('name');

    if (error || !data) {
      throw new Error(`Failed to load menu items: ${error?.message}`);
    }

    return data.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      categoryId: item.category_id,
      price: Number(item.price),
      preparationTimeMinutes: item.preparation_time_minutes,
      stationId: item.station_id,
      isAvailable: Boolean(item.is_available),
      image: item.image_url || '',
      dietary: item.dietary,
      isPopular: Boolean(item.is_popular),
      chefPick: Boolean(item.chef_pick),
      fastPrep: Boolean(item.fast_prep),
      fastPrepBadge: item.fast_prep_badge || undefined,
      portionNote: item.portion_note || undefined,
      spiceLevel: item.spice_level || undefined,
      allergens: item.allergens || [],
      alternativeItemIds: item.alternative_item_ids || [],
    }));
  }

  async getCategories(): Promise<MenuCategory[]> {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .order('display_order');

    if (error || !data) {
      throw new Error(`Failed to load menu categories: ${error?.message}`);
    }

    return data.map((cat) => ({
      id: cat.id,
      name: cat.name,
      displayOrder: cat.display_order,
      description: cat.description || '',
      iconName: cat.icon_name || undefined,
    }));
  }

  async getKitchenSnapshot(): Promise<KitchenStationSnapshot[]> {
    const { data, error } = await supabase
      .from('kitchen_stations')
      .select('*')
      .order('name');

    if (error || !data) {
      throw new Error(`Failed to load kitchen stations: ${error?.message}`);
    }

    return data.map((station) => ({
      stationId: station.id,
      stationName: station.name,
      totalCapacity: station.capacity_slots,
      activeLoad: station.active_load || 0,
      queueCount: station.queue_count || 0,
      currentWaitMinutes: station.current_wait_minutes || 0,
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

    if (error || !data) {
      throw new Error(`Failed to load orders: ${error?.message}`);
    }

    return data.map((order) => this.mapOrder(order));
  }

  async getOrder(id: string): Promise<CustomerOrder | null> {
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

    if (error || !data) {
      return null;
    }

    return this.mapOrder(data);
  }

  async createDemoOrder(input: CreateOrderInput): Promise<CustomerOrder> {
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const token = `RL-${randomSeq}`;
    const orderId = `ord-${token.toLowerCase()}-${Date.now().toString().slice(-4)}`;

    const menu = await this.getMenu();
    const lineItems = input.items.map((it) => {
      const menuItem = menu.find((m) => m.id === it.itemId);
      if (!menuItem) throw new Error(`Menu item not found: ${it.itemId}`);
      return {
        order_id: orderId,
        menu_item_id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: it.quantity,
        preparation_time_minutes: menuItem.preparationTimeMinutes,
        station_id: menuItem.stationId,
        notes: it.notes,
      };
    });

    const subtotal = lineItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax;

    const maxPrep = Math.max(...lineItems.map((l) => l.preparation_time_minutes), 5);
    const estReady = new Date(Date.now() + (maxPrep + 5) * 60000);

    const { data: orderData, error: orderError } = await supabase
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
        estimated_ready_time: formatTimeHHMM(estReady),
        status: 'PENDING',
        is_walk_in: false,
        feasibility_snapshot: 'FEASIBLE',
        notes: input.notes,
      })
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    if (lineItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('order_line_items')
        .insert(lineItems);

      if (itemsError) {
        console.error('Failed to insert line items', itemsError);
      }
    }

    const created = await this.getOrder(orderId);
    if (!created) throw new Error('Order creation verification failed.');
    return created;
  }

  async createWalkInOrder(input: CreateWalkInOrderInput): Promise<CustomerOrder> {
    const randomSeq = Math.floor(100 + Math.random() * 900);
    const token = `RL-${randomSeq}`;
    const orderId = `ord-${token.toLowerCase()}-${Date.now().toString().slice(-4)}`;

    const menu = await this.getMenu();
    const lineItems = input.items.map((it) => {
      const menuItem = menu.find((m) => m.id === it.itemId);
      if (!menuItem) throw new Error(`Menu item not found: ${it.itemId}`);
      return {
        order_id: orderId,
        menu_item_id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: it.quantity,
        preparation_time_minutes: menuItem.preparationTimeMinutes,
        station_id: menuItem.stationId,
      };
    });

    const subtotal = lineItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax;

    const maxPrep = Math.max(...lineItems.map((l) => l.preparation_time_minutes), 5);
    const estReady = new Date(Date.now() + (maxPrep + 3) * 60000);

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
        requested_deadline: input.requestedDeadline || formatTimeHHMM(estReady),
        estimated_ready_time: formatTimeHHMM(estReady),
        status: 'ACCEPTED',
        is_walk_in: true,
        feasibility_snapshot: 'FEASIBLE',
        notes: input.notes,
      });

    if (orderError) throw new Error(`Failed to create walk-in order: ${orderError.message}`);

    if (lineItems.length > 0) {
      await supabase.from('order_line_items').insert(lineItems);
    }

    const created = await this.getOrder(orderId);
    if (!created) throw new Error('Walk-in order creation verification failed.');
    return created;
  }

  async updateDemoOrderStatus(id: string, status: OrderStatus, note?: string): Promise<CustomerOrder> {
    const isToken = id.toUpperCase().startsWith('RL-');
    let updateQuery = supabase.from('orders').update({ status, updated_at: new Date().toISOString() });

    if (isToken) {
      updateQuery = updateQuery.ilike('order_token', id);
    } else {
      updateQuery = updateQuery.eq('id', id);
    }

    const { error } = await updateQuery;
    if (error) throw new Error(`Failed to update order status: ${error.message}`);

    if (note) {
      // Find the order id
      const order = await this.getOrder(id);
      if (order) {
        await supabase.from('order_status_history').insert({
          order_id: order.id,
          status,
          note,
        });
      }
    }

    const updated = await this.getOrder(id);
    if (!updated) throw new Error(`Order ${id} not found after update`);
    return updated;
  }

  async updateMenuAvailability(itemId: string, available: boolean): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .update({ is_available: available, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single();

    if (error || !data) throw new Error(`Failed to update menu item: ${error?.message}`);

    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      categoryId: data.category_id,
      price: Number(data.price),
      preparationTimeMinutes: data.preparation_time_minutes,
      stationId: data.station_id,
      isAvailable: Boolean(data.is_available),
      image: data.image_url || '',
      dietary: data.dietary,
      isPopular: Boolean(data.is_popular),
      chefPick: Boolean(data.chef_pick),
      fastPrep: Boolean(data.fast_prep),
      fastPrepBadge: data.fast_prep_badge || undefined,
      portionNote: data.portion_note || undefined,
      spiceLevel: data.spice_level || undefined,
      allergens: data.allergens || [],
      alternativeItemIds: data.alternative_item_ids || [],
    };
  }

  async resetDemoData(): Promise<void> {
    // Reset is a no-op or re-seed in Supabase production
  }

  private mapOrder(row: SupabaseOrderRow): CustomerOrder {
    const lineItems = (row.order_line_items || []).map((l) => ({
      itemId: l.menu_item_id || l.id || '',
      name: l.name,
      price: Number(l.price),
      quantity: l.quantity,
      preparationTimeMinutes: l.preparation_time_minutes,
      stationId: l.station_id,
      notes: l.notes || undefined,
    }));

    const statusHistory = (row.order_status_history || [])
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((h) => ({
        status: h.status,
        timestamp: h.timestamp,
        note: h.note || '',
      }));

    return {
      id: row.id,
      orderToken: row.order_token,
      orderType: row.order_type,
      customerName: row.customer_name,
      customerPhone: row.customer_phone || undefined,
      tableNumber: row.table_number || undefined,
      lineItems,
      subtotal: Number(row.subtotal),
      tax: Number(row.tax),
      total: Number(row.total),
      requestedDeadline: row.requested_deadline,
      estimatedReadyTime: row.estimated_ready_time,
      status: row.status as OrderStatus,
      isWalkIn: Boolean(row.is_walk_in),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      statusHistory,
      feasibilitySnapshot: row.feasibility_snapshot || 'FEASIBLE',
      notes: row.notes || undefined,
    };
  }
}

export const supabaseRestaurantApi = new SupabaseRestaurantApi();
