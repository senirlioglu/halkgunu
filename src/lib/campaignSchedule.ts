const TR_MONTHS = [
  "OCAK", "ŞUBAT", "MART", "NİSAN", "MAYIS", "HAZİRAN",
  "TEMMUZ", "AĞUSTOS", "EYLÜL", "EKİM", "KASIM", "ARALIK",
];

export function nextSaturdayMidnight(now: Date): Date {
  const target = new Date(now);
  target.setHours(0, 0, 0, 0);
  const day = target.getDay();
  const daysUntil = (6 - day + 7) % 7 || 7;
  target.setDate(target.getDate() + daysUntil);
  return target;
}

export function isCountdownDay(d: Date): boolean {
  const day = d.getDay();
  return day >= 1 && day <= 4;
}

export function upcomingWeekendLabel(now: Date): string {
  const sat = nextSaturdayMidnight(now);
  const sun = new Date(sat);
  sun.setDate(sat.getDate() + 1);
  const satDay = sat.getDate();
  const sunDay = sun.getDate();
  const satMonth = TR_MONTHS[sat.getMonth()];
  const sunMonth = TR_MONTHS[sun.getMonth()];
  if (sat.getMonth() === sun.getMonth()) {
    return `${satDay}-${sunDay} ${satMonth} CUMARTESİ PAZAR HALK GÜNÜ`;
  }
  return `${satDay} ${satMonth} - ${sunDay} ${sunMonth} CUMARTESİ PAZAR HALK GÜNÜ`;
}
