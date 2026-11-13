/**
 * Domain formatters for RushLess
 */

export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount || 0)}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  return `${Math.round(minutes)} min`;
}

export function formatTimeHHMM(dateOrString: Date | string): string {
  if (typeof dateOrString === 'string' && /^\d{1,2}:\d{2}$/.test(dateOrString)) {
    const [h, m] = dateOrString.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const formattedHour = h % 12 === 0 ? 12 : h % 12;
    return `${formattedHour}:${m.toString().padStart(2, '0')} ${period}`;
  }

  const d = typeof dateOrString === 'string' ? new Date(dateOrString) : dateOrString;
  if (!d || isNaN(d.getTime())) {
    return String(dateOrString || '');
  }

  const hours = d.getHours();
  const minutes = d.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const formattedHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${formattedHour}:${minutes.toString().padStart(2, '0')} ${period}`;
}

export function formatTime24H(d: Date): string {
  if (!d || isNaN(d.getTime())) return '12:00';
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function parseTimeToTodayDate(timeStr: string, baseDate: Date = new Date()): Date {
  if (!timeStr || typeof timeStr !== 'string') {
    return new Date(baseDate);
  }

  // Handle ISO string format
  if (timeStr.includes('T') || (timeStr.includes('-') && timeStr.length > 5)) {
    const parsed = new Date(timeStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (!timeStr.includes(':')) {
    return new Date(baseDate);
  }

  const [hStr, mStr] = timeStr.split(':');
  const hours = Number(hStr);
  const minutes = Number(mStr);

  if (isNaN(hours) || isNaN(minutes)) {
    return new Date(baseDate);
  }

  const target = new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    hours,
    minutes,
    0,
    0
  );

  // Midnight rollover forward:
  // baseDate is late evening (>= 18:00) and target time is early morning (< 12:00)
  if (target.getTime() < baseDate.getTime() && baseDate.getHours() >= 18 && hours < 12) {
    target.setDate(target.getDate() + 1);
  }
  // Midnight rollover backward:
  // baseDate is early morning (< 6:00) and target time was late evening (>= 18:00)
  else if (target.getTime() > baseDate.getTime() && baseDate.getHours() < 6 && hours >= 18) {
    target.setDate(target.getDate() - 1);
  }

  return target;
}

export function getStatusBadgeConfig(status: string): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'ACCEPTED':
    case 'PENDING':
      return {
        label: status === 'PENDING' ? 'Order Received' : 'Accepted',
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
      };
    case 'PREPARING':
      return {
        label: 'In Kitchen',
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
      };
    case 'READY':
      return {
        label: 'Ready for Pickup',
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
      };
    case 'COLLECTED':
      return {
        label: 'Collected',
        bg: 'bg-stone-100',
        text: 'text-stone-600',
        border: 'border-stone-200',
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
    default:
      return {
        label: status,
        bg: 'bg-stone-100',
        text: 'text-stone-700',
        border: 'border-stone-200',
      };
  }
}
