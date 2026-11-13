/**
 * Domain formatters for RushLess
 */

export function formatCurrency(amount: number): string {
  return `₹${Math.round(amount)}`;
}

export function formatMinutes(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  return `${Math.round(minutes)} min`;
}

export function formatTimeHHMM(dateOrString: Date | string): string {
  const d = typeof dateOrString === 'string' ? new Date(dateOrString) : dateOrString;
  if (isNaN(d.getTime())) {
    // If it's already an "HH:MM" string, convert to standard 12h display
    if (typeof dateOrString === 'string' && /^\d{1,2}:\d{2}$/.test(dateOrString)) {
      const [h, m] = dateOrString.split(':').map(Number);
      const period = h >= 12 ? 'PM' : 'AM';
      const formattedHour = h % 12 === 0 ? 12 : h % 12;
      return `${formattedHour}:${m.toString().padStart(2, '0')} ${period}`;
    }
    return String(dateOrString);
  }
  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatTime24H(d: Date): string {
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function parseTimeToTodayDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);
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
