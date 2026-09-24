export const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export function weekdayLabel(weekday: number): string {
  return WEEKDAYS[weekday] ?? String(weekday);
}

export type ScheduleBlock = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  active: boolean;
};

export type Slot = {
  start: string;
  end: string;
};

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

/** Gera os slots (ISO) de um dia a partir dos blocos de disponibilidade. */
export function generateSlots(blocks: ScheduleBlock[], dateStr: string): Slot[] {
  const base = new Date(`${dateStr}T00:00`);
  if (Number.isNaN(base.getTime())) return [];

  const weekday = base.getDay();
  const slots: Slot[] = [];

  for (const block of blocks) {
    if (!block.active || block.weekday !== weekday) continue;
    const startMinutes = toMinutes(block.start_time);
    const endMinutes = toMinutes(block.end_time);
    const step = block.slot_minutes || 30;

    for (let minutes = startMinutes; minutes + step <= endMinutes; minutes += step) {
      const start = new Date(base);
      start.setMinutes(minutes);
      const end = new Date(base);
      end.setMinutes(minutes + step);
      slots.push({ start: start.toISOString(), end: end.toISOString() });
    }
  }

  return slots.sort((a, b) => a.start.localeCompare(b.start));
}

export function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
