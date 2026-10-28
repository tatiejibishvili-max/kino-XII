export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function formatISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function sessionHasStarted(startsAt?: string, now = Date.now()): boolean {
  if (!startsAt) return false;
  const start = Date.parse(startsAt);
  return Number.isFinite(start) && start <= now;
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function describeDate(iso: string, today: string): { caption: string; day: string; month: string } {
  const date = parseISODate(iso);
  const tomorrow = formatISODate(addDays(parseISODate(today), 1));
  let caption = date.toLocaleDateString("en-GB", { weekday: "short" });

  if (iso === today) caption = "Today";
  else if (iso === tomorrow) caption = "Tomorrow";

  return {
    caption,
    day: String(date.getDate()),
    month: date.toLocaleDateString("en-GB", { month: "short" }),
  };
}
