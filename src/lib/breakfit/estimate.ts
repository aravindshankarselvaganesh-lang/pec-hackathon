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
  requestedDeadline: string; // "HH:MM" format or ISO
  kitchenSnapshots?: KitchenStationSnapshot[];
  allMenuItems?: MenuItem[];
  currentTime?: Date;
  bufferMinutes?: number;
}

/**
 * BreakFit Feasibility Engine
 * 
 * Deterministic, transparent estimator:
 * 1. Groups basket items by kitchen preparation station.
 * 2. Computes the station lead time = current station queue wait + max(item prep times) + capacity batch delay.
 * 3. Identifies the bottleneck station across the basket.
 * 4. Adds packaging/dispatch buffer to compute the Estimated Ready Time.
 * 5. Compares with the customer's deadline. If infeasible, proposes concrete alternative substitutions or later pickup time.
 */
export function evaluateBreakFit({
  items,
  requestedDeadline,
  kitchenSnapshots = [],
  allMenuItems = [],
  currentTime = new Date(),
  bufferMinutes = 3,
}: EvaluateBreakFitInput): BreakFitResult {
  const safeBufferMinutes = Math.max(0, bufferMinutes ?? 3);
  const safeRequestedDeadline = requestedDeadline || formatTime24H(new Date(currentTime.getTime() + 15 * 60000));

  // Edge Case 1: Empty basket
  if (!items || items.length === 0) {
    const defaultReady = new Date(currentTime.getTime() + 10 * 60000);
    const deadlineDate = parseTimeToTodayDate(safeRequestedDeadline, currentTime);
    const diffMs = deadlineDate.getTime() - currentTime.getTime();
    const minutesRemainingToDeadline = Math.max(0, Math.floor(diffMs / 60000));

    return {
      feasibility: 'EMPTY',
      statusLabel: 'Cart is empty',
      requestedDeadline: safeRequestedDeadline,
      estimatedReadyTime: formatTimeHHMM(defaultReady),
      bufferMinutes: safeBufferMinutes,
      totalEstimatedMinutes: 0,
      minutesRemainingToDeadline,
      explanation: 'Add dishes to see estimated ready time.',
      alternativeSuggestions: [],
      isDemoSimulation: true,
    };
  }

  // Edge Case 2: Deadline parsing & validation (supports midnight roll-overs and past deadlines)
  const deadlineDate = parseTimeToTodayDate(safeRequestedDeadline, currentTime);
  const diffMs = deadlineDate.getTime() - currentTime.getTime();
  const minutesRemainingToDeadline = Math.floor(diffMs / 60000);

  if (minutesRemainingToDeadline <= 0) {
    const quickReady = new Date(currentTime.getTime() + 12 * 60000);
    return {
      feasibility: 'INVALID_DEADLINE',
      statusLabel: 'Time passed',
      requestedDeadline: safeRequestedDeadline,
      estimatedReadyTime: formatTimeHHMM(quickReady),
      bufferMinutes: safeBufferMinutes,
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
    string,
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

  // Populate active station wait times from kitchen snapshots (safely handles zero capacity and zero load)
  (kitchenSnapshots || []).forEach((snap) => {
    if (!stationStats[snap.stationId]) {
      stationStats[snap.stationId] = {
        items: [],
        maxPrepMinutes: 0,
        totalQuantity: 0,
        stationWaitMinutes: Math.max(0, snap.currentWaitMinutes || 0),
        stationName: snap.stationName || snap.stationId,
        capacity: typeof snap.totalCapacity === 'number' ? Math.max(0, snap.totalCapacity) : 2,
      };
    } else {
      stationStats[snap.stationId].stationWaitMinutes = Math.max(0, snap.currentWaitMinutes || 0);
      stationStats[snap.stationId].stationName = snap.stationName || stationStats[snap.stationId].stationName;
      if (typeof snap.totalCapacity === 'number') {
        stationStats[snap.stationId].capacity = Math.max(0, snap.totalCapacity);
      }
    }
  });

  // Calculate station loading from basket items
  items.forEach((ci) => {
    const stationId = ci.menuItem.stationId || 'quick-bites';
    if (!stationStats[stationId]) {
      stationStats[stationId] = {
        items: [],
        maxPrepMinutes: 0,
        totalQuantity: 0,
        stationWaitMinutes: 0,
        stationName: stationId,
        capacity: 2,
      };
    }

    stationStats[stationId].items.push(ci);
    stationStats[stationId].totalQuantity += ci.quantity || 1;
    const itemPrep = ci.menuItem.preparationTimeMinutes || 0;
    if (itemPrep > stationStats[stationId].maxPrepMinutes) {
      stationStats[stationId].maxPrepMinutes = itemPrep;
    }
  });

  // Calculate required minutes per station and identify bottleneck
  let maxStationMinutes = 0;
  let bottleneckStationId: StationId | null = null;

  (Object.keys(stationStats) as StationId[]).forEach((sId) => {
    const stat = stationStats[sId];
    if (stat.totalQuantity > 0) {
      // Handle zero-capacity vs normal capacity batch factor
      let batchDelay = 0;
      if (stat.capacity <= 0) {
        // Zero capacity (counter unstaffed or offline): every item incurs sequential delay
        batchDelay = stat.totalQuantity * 3;
      } else if (stat.totalQuantity > stat.capacity) {
        batchDelay = Math.ceil((stat.totalQuantity - stat.capacity) / stat.capacity) * 2;
      }

      // Station queue wait (can be 0 for calm/zero-load) + max prep time + batch delay
      const stationTotal = stat.stationWaitMinutes + stat.maxPrepMinutes + batchDelay;

      if (bottleneckStationId === null || stationTotal > maxStationMinutes) {
        maxStationMinutes = stationTotal;
        bottleneckStationId = sId;
      }
    }
  });

  // Fallback to first item's station if all stations had 0 loading
  if (!bottleneckStationId) {
    bottleneckStationId = (items[0]?.menuItem?.stationId as StationId) || 'quick-bites';
  }

  const bottleneck = stationStats[bottleneckStationId] || {
    stationName: 'Kitchen',
    stationWaitMinutes: 0,
    capacity: 2,
    maxPrepMinutes: 0,
  };

  const totalEstimatedMinutes = Math.max(safeBufferMinutes, maxStationMinutes + safeBufferMinutes);
  const estimatedReadyDate = new Date(currentTime.getTime() + totalEstimatedMinutes * 60000);
  const estimatedReadyTimeStr = formatTimeHHMM(estimatedReadyDate);

  // Compare against requested deadline
  const fitsDeadline = estimatedReadyDate.getTime() <= deadlineDate.getTime();
  const timeSlackMinutes = minutesRemainingToDeadline - totalEstimatedMinutes;

  let feasibility: FeasibilityStatus;
  let statusLabel: string;
  let explanation: string;

  if (fitsDeadline) {
    if (timeSlackMinutes <= 2) {
      feasibility = 'RISKY';
      statusLabel = 'Tight fit';
      explanation = `Ready ~${estimatedReadyTimeStr} (~${totalEstimatedMinutes} min). Tight fit for your ${formatTimeHHMM(safeRequestedDeadline)} deadline.`;
    } else {
      feasibility = 'FEASIBLE';
      statusLabel = 'On time';
      explanation = `Ready ~${estimatedReadyTimeStr} (~${totalEstimatedMinutes} min). Comfortably on time for ${formatTimeHHMM(safeRequestedDeadline)}.`;
    }
  } else {
    feasibility = 'INFEASIBLE';
    const overrunMinutes = Math.abs(timeSlackMinutes);
    statusLabel = 'May be late';
    explanation = `Ready ~${estimatedReadyTimeStr} (~${totalEstimatedMinutes} min). Estimated ~${overrunMinutes} min past your ${formatTimeHHMM(safeRequestedDeadline)} deadline.`;
  }

  // Generate deterministic alternative suggestions if infeasible or risky
  const alternativeSuggestions: AlternativeSuggestion[] = [];

  if (feasibility === 'INFEASIBLE' || feasibility === 'RISKY') {
    // Find bottleneck items ordered by preparation time descending
    const bottleneckItems = items
      .filter((ci) => (ci.menuItem.stationId || 'quick-bites') === bottleneckStationId)
      .sort((a, b) => (b.menuItem.preparationTimeMinutes || 0) - (a.menuItem.preparationTimeMinutes || 0));

    const suggestedIds = new Set<string>();

    for (const ci of bottleneckItems) {
      const origItem = ci.menuItem;
      const origStation = stationStats[origItem.stationId] || bottleneck;
      const origTimeEstimate = origStation.stationWaitMinutes + (origItem.preparationTimeMinutes || 0);

      // Check explicit alternativeItemIds configured on the menu item
      if (origItem.alternativeItemIds && origItem.alternativeItemIds.length > 0) {
        for (const altId of origItem.alternativeItemIds) {
          if (suggestedIds.has(altId)) continue;

          const altItem = (allMenuItems || []).find((m) => m.id === altId && m.isAvailable);
          if (altItem) {
            const altStation = stationStats[altItem.stationId] || { stationWaitMinutes: 0 };
            const altTimeEstimate = (altStation.stationWaitMinutes || 0) + (altItem.preparationTimeMinutes || 0);
            const timeSaved = origTimeEstimate - altTimeEstimate;

            // Only suggest if substitution is strictly faster!
            if (timeSaved > 0) {
              suggestedIds.add(altId);
              alternativeSuggestions.push({
                originalItem: origItem,
                suggestedItem: altItem,
                timeSavedMinutes: timeSaved,
                priceDifference: altItem.price - origItem.price,
                reason: `Switch to ${altItem.name}. Ready ~${timeSaved} min faster.`,
              });
            }
          }
        }
      }
    }

    // Fallback: if no explicit alternatives saved time, suggest fastest available item in calmer stations
    if (alternativeSuggestions.length === 0 && bottleneckItems.length > 0) {
      const worstItem = bottleneckItems[0].menuItem;
      const origStation = stationStats[worstItem.stationId] || bottleneck;
      const origTimeEstimate = origStation.stationWaitMinutes + (worstItem.preparationTimeMinutes || 0);

      const candidateAlts = (allMenuItems || [])
        .filter((m) => m.isAvailable && m.id !== worstItem.id)
        .map((m) => {
          const altStation = stationStats[m.stationId] || { stationWaitMinutes: 0 };
          const altTimeEstimate = (altStation.stationWaitMinutes || 0) + (m.preparationTimeMinutes || 0);
          const timeSaved = origTimeEstimate - altTimeEstimate;
          return { item: m, timeSaved };
        })
        .filter((c) => c.timeSaved > 0)
        .sort((a, b) => b.timeSaved - a.timeSaved)
        .slice(0, 2);

      for (const cand of candidateAlts) {
        alternativeSuggestions.push({
          originalItem: worstItem,
          suggestedItem: cand.item,
          timeSavedMinutes: cand.timeSaved,
          priceDifference: cand.item.price - worstItem.price,
          reason: `Switch to ${cand.item.name}. Ready ~${cand.timeSaved} min faster.`,
        });
      }
    }
  }

  // Recommended later deadline (next clean 5-minute interval after estimated ready)
  const roundedLaterMinutes = Math.ceil((totalEstimatedMinutes + 2) / 5) * 5;
  const suggestedLaterDate = new Date(currentTime.getTime() + roundedLaterMinutes * 60000);
  const suggestedLaterDeadline = formatTime24H(suggestedLaterDate);

  return {
    feasibility,
    statusLabel,
    requestedDeadline: safeRequestedDeadline,
    estimatedReadyTime: estimatedReadyTimeStr,
    bufferMinutes: safeBufferMinutes,
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
