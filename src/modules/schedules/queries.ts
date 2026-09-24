import { createClient } from "@/lib/supabase/server";

import type { ScheduleBlock } from "./slots";

export async function listSchedules(
  professionalId: string,
): Promise<ScheduleBlock[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("professional_schedules")
    .select("id, weekday, start_time, end_time, slot_minutes, active")
    .eq("professional_id", professionalId)
    .order("weekday", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ScheduleBlock[];
}
