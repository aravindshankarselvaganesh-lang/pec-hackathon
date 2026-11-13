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

/**
 * Frontend Service Interface for Restaurant Operations
 * 
 * In this frontend prototype, this contract is satisfied by MockRestaurantApi.
 * During backend integration in OpenCode, this interface will be swapped with
 * an HttpRestaurantApi implementation calling /api/v1 endpoints without modifying
 * consuming components.
 */
export interface RestaurantApi {
  getRestaurant(): Promise<Restaurant>;
  getMenu(): Promise<MenuItem[]>;
  getCategories(): Promise<MenuCategory[]>;
  getKitchenSnapshot(): Promise<KitchenStationSnapshot[]>;
  getOrders(): Promise<CustomerOrder[]>;
  getOrder(id: string): Promise<CustomerOrder | null>;
  createDemoOrder(input: CreateOrderInput): Promise<CustomerOrder>;
  updateDemoOrderStatus(id: string, status: OrderStatus, note?: string): Promise<CustomerOrder>;
  createWalkInOrder(input: CreateWalkInOrderInput): Promise<CustomerOrder>;
  updateMenuAvailability(itemId: string, available: boolean): Promise<MenuItem>;
  resetDemoData(): Promise<void>;
}
