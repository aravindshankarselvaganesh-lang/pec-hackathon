import { KitchenStationSnapshot, PreparationStation } from '@/domain/types';

export const DEMO_PREPARATION_STATIONS: PreparationStation[] = [
  {
    id: 'quick-bites',
    name: 'Quick Bites',
    capacitySlots: 3,
    averageTimeMultiplier: 1.0,
    description: 'Sandwiches, wraps, and momos',
  },
  {
    id: 'hot-kitchen',
    name: 'Hot Kitchen',
    capacitySlots: 2,
    averageTimeMultiplier: 1.2,
    description: 'Dosas, curries, burgers, and pasta',
  },
  {
    id: 'fryer',
    name: 'Fryer',
    capacitySlots: 2,
    averageTimeMultiplier: 1.0,
    description: 'Samosas and crispy fries',
  },
  {
    id: 'drinks',
    name: 'Drinks Bar',
    capacitySlots: 4,
    averageTimeMultiplier: 0.8,
    description: 'Chai, coffee, boba, and coolers',
  },
];

export const INITIAL_KITCHEN_SNAPSHOTS: KitchenStationSnapshot[] = [
  {
    stationId: 'quick-bites',
    stationName: 'Quick Bites',
    totalCapacity: 3,
    activeLoad: 1,
    queueCount: 1,
    currentWaitMinutes: 4,
    status: 'CALM',
  },
  {
    stationId: 'hot-kitchen',
    stationName: 'Hot Kitchen',
    totalCapacity: 2,
    activeLoad: 2,
    queueCount: 3,
    currentWaitMinutes: 9,
    status: 'PEAK',
  },
  {
    stationId: 'fryer',
    stationName: 'Fryer',
    totalCapacity: 2,
    activeLoad: 1,
    queueCount: 1,
    currentWaitMinutes: 4,
    status: 'BUSY',
  },
  {
    stationId: 'drinks',
    stationName: 'Drinks Bar',
    totalCapacity: 4,
    activeLoad: 1,
    queueCount: 0,
    currentWaitMinutes: 2,
    status: 'CALM',
  },
];
