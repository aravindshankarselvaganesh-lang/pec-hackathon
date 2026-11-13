import {
  AlternativeSuggestion,
  BreakFitResult,
  CartItem,
  FeasibilityStatus,
  KitchenStationSnapshot,
  MenuItem,
  StationId,
} from '@/domain/types';
import { formatTime24H, formatTimeHHMM, parseTimeToTodayDate } from '@/domain/formatters';

export interface EvaluateBreakFitInput {
  items: CartItem[];
  requestedDeadline: string; // "HH:MM" format
  kitchenSnapshots: KitchenStationSnapshot[];
  allMenuItems: MenuItem[];
  currentTime?: Date;
  bufferMinutes?: number;
}

/**
 * BreakFit Feasibility Engine (Frontend Demo)
 * 
 * Deterministic, transparent estimator:
 * 1. Groups basket items by kitchen preparation station.
 * 2. Computes the station lead time = current station queue wait + max(item prep times) + capacity batch delay.
 * 3. Identifies the bottleneck station across the basket.
 * 4. Adds packaging/dispatch buffer to compute the Estimated Ready Time.
 * 5. Compares with the customer's deadline. If infeasible, proposes a concrete alternative substitution or later pickup time.
 */
export function evaluateBreakFit({
  items,
  requestedDeadline,
  kitchenSnapshots,
  allMenuItems,
  currentTime = new Date(),
  bufferMinutes = 3,
}: EvaluateBreakFitInput): BreakFitResult {
  // Edge Case 1: Empty basket
  if (!items || items.length === 0) {
    const defaultReady = new Date(currentTime.getTime() + 10 * 60000);
    return {
      feasibility: 'EMPTY',
      statusLabel: 'Cart is empty',
      requestedDeadline,
      estimatedReadyTime: formatTimeHHMM(defaultReady),
      bufferMinutes,
      totalEstimatedMinutes: 0,
      minutesRemainingToDeadline: 0,
      explanation: 'Add dishes to see estimated ready time.',
      alternativeSuggestions: [],
      isDemoSimulation: true,
    };
  }

  // Edge Case 2: Deadline parsing & validation
  const deadlineDate = parseTimeToTodayDate(requestedDeadline);
  const diffMs = deadlineDate.getTime() - currentTime.getTime();
  const minutesRemainingToDeadline = Math.floor(diffMs / 60000);

  if (minutesRemainingToDeadline <= 0) {
    const quickReady = new Date(currentTime.getTime() + 12 * 60000);
    return {
      feasibility: 'INVALID_DEADLINE',
      statusLabel: 'Time passed',
      requestedDeadline,
      estimatedReadyTime: formatTimeHHMM(quickReady),
      bufferMinutes,
      totalEstimatedMinutes: 12,
      minutesRemainingToDeadline,
      explanation: 'Selected time has passed. Please choose a future time.',
      alternativeSuggestions: [],
      suggestedLaterDeadline: formatTime24H(new Date(currentTime.getTime() + 15 * 60000)),
      isDemoSimulation: true,
    };
  }

  // Group items by station and calculate station requirements
  const stationStats: Record<
    StationId,
    {
      items: CartItem[];
      maxPrepMinutes: number;
      totalQuantity: number;
      stationWaitMinutes: number;
      stationName: string;
      capacity: number;
    }
  > = {
    'quick-bites': { items: [], maxPrepMinutes: 0, totalQuantity: 0, stationWaitMinutes: 0, stationName: 'Quick Bites', capacity: 3 },
    'hot-kitchen': { items: [], maxPrepMinutes: 0, totalQuantity: 0, stationWaitMinutes: 0, stationName: 'Hot Kitchen', capacity: 2 },
    'fryer': { items: [], maxPrepMinutes: 0, totalQuantity: 0, stationWaitMinutes: 0, stationName: 'Fryer', capacity: 2 },
    'drinks': { items: [], maxPrepMinutes: 0, totalQuantity: 0, stationWaitMinutes: 0, stationName: 'Drinks Bar', capacity: 4 },
  };

  // Populate active station wait times from kitchen snapshots
  kitchenSnapshots.forEach((snap) => {
    if (stationStats[snap.stationId]) {
      stationStats[snap.stationId].stationWaitMinutes = snap.currentWaitMinutes;
      stationStats[snap.stationId].stationName = snap.stationName;
      stationStats[snap.stationId].capacity = snap.totalCapacity;
    }
  });

  // Calculate station loading
  items.forEach((ci) => {
    const stationId = ci.menuItem.stationId;
    if (stationStats[stationId]) {
      stationStats[stationId].items.push(ci);
      stationStats[stationId].totalQuantity += ci.quantity;
      if (ci.menuItem.preparationTimeMinutes > stationStats[stationId].maxPrepMinutes) {
        stationStats[stationId].maxPrepMinutes = ci.menuItem.preparationTimeMinutes;
      }
    }
  });

  // Calculate required minutes per station
  let maxStationMinutes = 0;
  let bottleneckStationId: StationId = 'quick-bites';

  (Object.keys(stationStats) as StationId[]).forEach((sId) => {
    const stat = stationStats[sId];
    if (stat.totalQuantity > 0) {
      // Station queue wait + max prep time + slight batch factor if quantity exceeds station capacity
      const batchDelay = Math.max(0, Math.ceil((stat.totalQuantity - stat.capacity) / Math.max(1, stat.capacity)) * 2);
      const stationTotal = stat.stationWaitMinutes + stat.maxPrepMinutes + batchDelay;

      if (stationTotal > maxStationMinutes) {
        maxStationMinutes = stationTotal;
        bottleneckStationId = sId;
      }
    }
  });

  const totalEstimatedMinutes = Math.max(5, maxStationMinutes + bufferMinutes);
  const estimatedReadyDate = new Date(currentTime.getTime() + totalEstimatedMinutes * 60000);
  const estimatedReadyTimeStr = formatTimeHHMM(estimatedReadyDate);

  // Compare against requested deadline
  const fitsDeadline = estimatedReadyDate.getTime() <= deadlineDate.getTime();
  const timeSlackMinutes = minutesRemainingToDeadline - totalEstimatedMinutes;

  let feasibility: FeasibilityStatus;
  let statusLabel: string;
  let explanation: string;

  const bottleneck = stationStats[bottleneckStationId];

  if (fitsDeadline) {
    if (timeSlackMinutes <= 2) {
      feasibility = 'RISKY';
      statusLabel = 'Tight fit';
      explanation = `Ready ~${estimatedReadyTimeStr} (~${totalEstimatedMinutes} min). Tight fit for your ${formatTimeHHMM(requestedDeadline)} deadline.`;
    } else {
      feasibility = 'FEASIBLE';
      statusLabel = 'On time';
      explanation = `Ready ~${estimatedReadyTimeStr} (~${totalEstimatedMinutes} min). Comfortably on time for ${formatTimeHHMM(requestedDeadline)}.`;
    }
  } else {
    feasibility = 'INFEASIBLE';
    const overrunMinutes = Math.abs(timeSlackMinutes);
    statusLabel = 'May be late';
    explanation = `Ready ~${estimatedReadyTimeStr} (~${totalEstimatedMinutes} min). Estimated ~${overrunMinutes} min past your ${formatTimeHHMM(requestedDeadline)} deadline.`;
  }

  // Generate deterministic alternative suggestions if infeasible or risky
  const alternativeSuggestions: AlternativeSuggestion[] = [];

  if (feasibility === 'INFEASIBLE' || feasibility === 'RISKY') {
    // Find the item causing the biggest bottleneck
    const bottleneckItems = items
      .filter((ci) => ci.menuItem.stationId === bottleneckStationId)
      .sort((a, b) => b.menuItem.preparationTimeMinutes - a.menuItem.preparationTimeMinutes);

    const worstItem = bottleneckItems[0]?.menuItem;

    if (worstItem && worstItem.alternativeItemIds && worstItem.alternativeItemIds.length > 0) {
      worstItem.alternativeItemIds.forEach((altId) => {
        const altItem = allMenuItems.find((m) => m.id === altId && m.isAvailable);
        if (altItem) {
          // Calculate time saved
          const altStation = stationStats[altItem.stationId];
          const altTimeEstimate = altStation.stationWaitMinutes + altItem.preparationTimeMinutes;
          const origTimeEstimate = bottleneck.stationWaitMinutes + worstItem.preparationTimeMinutes;
          const timeSaved = Math.max(1, origTimeEstimate - altTimeEstimate);

          if (timeSaved > 0) {
            alternativeSuggestions.push({
              originalItem: worstItem,
              suggestedItem: altItem,
              timeSavedMinutes: timeSaved,
              priceDifference: altItem.price - worstItem.price,
              reason: `Switch to ${altItem.name}. Ready ~${timeSaved} min faster.`,
            });
          }
        }
      });
    }
  }

  // Recommended later deadline (next clean 5-minute interval after estimated ready)
  const roundedLaterMinutes = Math.ceil((totalEstimatedMinutes + 2) / 5) * 5;
  const suggestedLaterDate = new Date(currentTime.getTime() + roundedLaterMinutes * 60000);
  const suggestedLaterDeadline = formatTime24H(suggestedLaterDate);

  return {
    feasibility,
    statusLabel,
    requestedDeadline,
    estimatedReadyTime: estimatedReadyTimeStr,
    bufferMinutes,
    totalEstimatedMinutes,
    minutesRemainingToDeadline,
    bottleneckStation: {
      stationId: bottleneckStationId,
      stationName: bottleneck.stationName,
      stationWaitMinutes: bottleneck.stationWaitMinutes,
    },
    explanation,
    alternativeSuggestions,
    suggestedLaterDeadline,
    isDemoSimulation: true,
  };
}
