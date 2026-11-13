import { evaluateBreakFit } from '../src/lib/breakfit/estimate.ts';
import {
  formatCurrency,
  formatMinutes,
  formatTimeHHMM,
  formatTime24H,
  parseTimeToTodayDate,
} from '../src/domain/formatters.ts';

const mockMenu = [
  {
    id: 'item-slow-curry',
    name: 'Slow Dum Biryani',
    description: 'Slow cooked',
    categoryId: 'mains',
    price: 250,
    preparationTimeMinutes: 18,
    stationId: 'hot-kitchen',
    isAvailable: true,
    image: '/images/biryani.jpg',
    dietary: 'NON_VEG',
    alternativeItemIds: ['item-quick-sandwich', 'item-super-slow'],
  },
  {
    id: 'item-quick-sandwich',
    name: 'Quick Bombay Sandwich',
    description: 'Quick pressed sandwich',
    categoryId: 'quick',
    price: 120,
    preparationTimeMinutes: 4,
    stationId: 'quick-bites',
    isAvailable: true,
    image: '/images/sandwich.jpg',
    dietary: 'VEG',
  },
  {
    id: 'item-super-slow',
    name: 'Super Slow Dish',
    description: 'Takes 25 mins',
    categoryId: 'mains',
    price: 300,
    preparationTimeMinutes: 25,
    stationId: 'hot-kitchen',
    isAvailable: true,
    image: '/images/slow.jpg',
    dietary: 'NON_VEG',
  },
  {
    id: 'item-cold-drink',
    name: 'Cold Coffee',
    description: 'Chilled coffee',
    categoryId: 'beverages',
    price: 80,
    preparationTimeMinutes: 2,
    stationId: 'drinks',
    isAvailable: true,
    image: '/images/coffee.jpg',
    dietary: 'BEVERAGE',
  },
];

const mockKitchen = [
  {
    stationId: 'quick-bites',
    stationName: 'Quick Bites',
    totalCapacity: 3,
    activeLoad: 0,
    queueCount: 0,
    currentWaitMinutes: 0,
    status: 'CALM',
  },
  {
    stationId: 'hot-kitchen',
    stationName: 'Hot Kitchen',
    totalCapacity: 2,
    activeLoad: 2,
    queueCount: 3,
    currentWaitMinutes: 10,
    status: 'PEAK',
  },
  {
    stationId: 'fryer',
    stationName: 'Fryer',
    totalCapacity: 0, // ZERO CAPACITY counter
    activeLoad: 0,
    queueCount: 0,
    currentWaitMinutes: 0,
    status: 'CALM',
  },
  {
    stationId: 'drinks',
    stationName: 'Drinks Bar',
    totalCapacity: 4,
    activeLoad: 0,
    queueCount: 0,
    currentWaitMinutes: 0,
    status: 'CALM',
  },
];

let failures = 0;
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failures++;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('--- 1. AUDIT: Empty Cart Edge Case ---');
const emptyResult = evaluateBreakFit({
  items: [],
  requestedDeadline: '12:30',
  kitchenSnapshots: mockKitchen,
  allMenuItems: mockMenu,
  currentTime: new Date(2026, 0, 1, 12, 0),
});
assert(emptyResult.feasibility === 'EMPTY', 'Empty basket returns EMPTY feasibility');
assert(emptyResult.totalEstimatedMinutes === 0, 'Total minutes is 0 for empty cart');
assert(emptyResult.estimatedReadyTime.includes(':'), 'Estimated ready time is formatted');
assert(emptyResult.alternativeSuggestions.length === 0, 'No alternatives for empty cart');

console.log('\n--- 2. AUDIT: Deadline in the Past ---');
const pastResult = evaluateBreakFit({
  items: [{ menuItem: mockMenu[0], quantity: 1 }],
  requestedDeadline: '11:45',
  kitchenSnapshots: mockKitchen,
  allMenuItems: mockMenu,
  currentTime: new Date(2026, 0, 1, 12, 0),
});
assert(pastResult.feasibility === 'INVALID_DEADLINE', 'Past deadline returns INVALID_DEADLINE');
assert(pastResult.statusLabel === 'Time passed', 'Status label is "Time passed"');
assert(pastResult.suggestedLaterDeadline === '12:15', 'Suggests 15 mins in future');

console.log('\n--- 3. AUDIT: Midnight Roll-overs ---');
// 23:50 base, customer selects 00:15 (next day)
const midnightResult = evaluateBreakFit({
  items: [{ menuItem: mockMenu[0], quantity: 1 }],
  requestedDeadline: '00:15',
  kitchenSnapshots: mockKitchen,
  allMenuItems: mockMenu,
  currentTime: new Date(2026, 0, 1, 23, 50),
});
assert(midnightResult.feasibility !== 'INVALID_DEADLINE', 'Midnight rollover is NOT marked as invalid deadline');
assert(midnightResult.minutesRemainingToDeadline === 25, `Expected 25 mins remaining, got ${midnightResult.minutesRemainingToDeadline}`);

// 00:10 base, customer selects 23:50 (which was 20 mins ago yesterday)
const pastEveningResult = evaluateBreakFit({
  items: [{ menuItem: mockMenu[0], quantity: 1 }],
  requestedDeadline: '23:50',
  kitchenSnapshots: mockKitchen,
  allMenuItems: mockMenu,
  currentTime: new Date(2026, 0, 2, 0, 10),
});
assert(pastEveningResult.feasibility === 'INVALID_DEADLINE', 'Early morning ordering with yesterday late evening deadline is detected as past');

console.log('\n--- 4. AUDIT: Station with Zero Capacity ---');
const zeroCapItem = {
  id: 'item-fried-snack',
  name: 'Fried Samosa',
  description: 'Crispy samosa',
  categoryId: 'snacks',
  price: 50,
  preparationTimeMinutes: 5,
  stationId: 'fryer', // Fryer has totalCapacity: 0 in mockKitchen
  isAvailable: true,
  image: '/images/samosa.jpg',
  dietary: 'VEG',
};
const zeroCapResult = evaluateBreakFit({
  items: [{ menuItem: zeroCapItem, quantity: 2 }],
  requestedDeadline: '12:30',
  kitchenSnapshots: mockKitchen,
  allMenuItems: mockMenu,
  currentTime: new Date(2026, 0, 1, 12, 0),
});
assert(!isNaN(zeroCapResult.totalEstimatedMinutes), 'Zero capacity does not produce NaN');
assert(zeroCapResult.bottleneckStation.stationId === 'fryer', 'Bottleneck correctly identified as fryer');

console.log('\n--- 5. AUDIT: Station with Zero Load ---');
const zeroLoadItem = {
  id: 'item-cold-drink',
  name: 'Cold Coffee',
  description: 'Chilled coffee',
  categoryId: 'beverages',
  price: 80,
  preparationTimeMinutes: 2,
  stationId: 'drinks', // Drinks has 0 wait and 0 active load
  isAvailable: true,
  image: '/images/coffee.jpg',
  dietary: 'BEVERAGE',
};
const zeroLoadResult = evaluateBreakFit({
  items: [{ menuItem: zeroLoadItem, quantity: 1 }],
  requestedDeadline: '12:20',
  kitchenSnapshots: mockKitchen,
  allMenuItems: mockMenu,
  currentTime: new Date(2026, 0, 1, 12, 0),
});
assert(zeroLoadResult.bottleneckStation.stationId === 'drinks', 'Bottleneck correctly identified for zero-load station');
assert(zeroLoadResult.totalEstimatedMinutes >= 5, 'Enforces clean buffer/prep time');
assert(zeroLoadResult.feasibility === 'FEASIBLE', 'Zero-load station item comfortably on time');

console.log('\n--- 6. AUDIT: Bottleneck Station Detection & Alternative Suggestions Logic ---');
// Hot kitchen has 10 min wait, slow biryani has 18 min prep = 28 min total + 3 buffer = 31 min
// Requested deadline is 12:20 (20 min window) -> INFEASIBLE (takes 31 min, 11 min overrun)
const altResult = evaluateBreakFit({
  items: [{ menuItem: mockMenu[0], quantity: 1 }],
  requestedDeadline: '12:20',
  kitchenSnapshots: mockKitchen,
  allMenuItems: mockMenu,
  currentTime: new Date(2026, 0, 1, 12, 0),
});
assert(altResult.feasibility === 'INFEASIBLE', 'Identified as INFEASIBLE');
assert(altResult.bottleneckStation.stationId === 'hot-kitchen', 'Bottleneck station is hot-kitchen');
assert(altResult.alternativeSuggestions.length > 0, 'Generated alternative suggestion');

// Check that ONLY faster items are suggested!
// 'item-super-slow' takes 25 mins (SLOWER than 18 mins), it MUST NOT be suggested!
const superSlowSuggestion = altResult.alternativeSuggestions.find(
  (s) => s.suggestedItem.id === 'item-super-slow'
);
assert(!superSlowSuggestion, 'Bug fixed: Slower item is NEVER suggested as faster alternative');

// Check that 'item-quick-sandwich' is suggested and time saved is positive
const quickSuggestion = altResult.alternativeSuggestions.find(
  (s) => s.suggestedItem.id === 'item-quick-sandwich'
);
assert(Boolean(quickSuggestion), 'Quick sandwich is suggested');
assert(quickSuggestion.timeSavedMinutes > 0, `Time saved is strictly positive (${quickSuggestion?.timeSavedMinutes} min)`);

console.log('\n--- 7. AUDIT: Formatters & Hydration Determinism ---');
assert(formatTimeHHMM('14:30') === '2:30 PM', 'formatTimeHHMM converts 14:30 to 2:30 PM');
assert(formatTimeHHMM('00:05') === '12:05 AM', 'formatTimeHHMM converts 00:05 to 12:05 AM');
assert(formatTimeHHMM('12:00') === '12:00 PM', 'formatTimeHHMM converts 12:00 to 12:00 PM');
assert(formatTime24H(new Date(2026, 0, 1, 9, 5)) === '09:05', 'formatTime24H pads 09:05');
assert(formatCurrency(120) === '₹120', 'formatCurrency produces ₹120');

if (failures === 0) {
  console.log('\n🎉 ALL 18 AUDIT CHECKS PASSED PERFECTLY!');
  process.exit(0);
} else {
  console.error(`\n💥 ${failures} CHECK(S) FAILED!`);
  process.exit(1);
}
