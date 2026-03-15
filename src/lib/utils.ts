export function formatCurrency(value: number | null): string {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const HOURS_PER_YEAR = 52 * 40;

export function hourlyToAnnual(value: number | null): number | null {
  if (value === null) return null;
  return value * HOURS_PER_YEAR;
}

export function annualToHourly(value: number | null): number | null {
  if (value === null) return null;
  return value / HOURS_PER_YEAR;
}

export function formatHourly(value: number | null): string {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCompensationRange(
  min: number | null,
  max: number | null,
  compensationType: "salary" | "hourly"
): string {
  const formatter = compensationType === "salary" ? formatCurrency : formatHourly;
  const suffix = compensationType === "salary" ? "/yr" : "/hr";

  if (min !== null && max !== null) {
    return `${formatter(min)} - ${formatter(max)} ${suffix}`;
  }
  if (min !== null) {
    return `${formatter(min)} ${suffix}`;
  }
  if (max !== null) {
    return `${formatter(max)} ${suffix}`;
  }
  return "N/A";
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || singular + "s");
}

export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return "unknown time";

  const date = new Date(dateStr.includes("T") ? dateStr : `${dateStr}Z`);
  if (Number.isNaN(date.getTime())) return "unknown time";

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365);
  return `${years}y ago`;
}
