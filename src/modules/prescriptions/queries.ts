import { createClient } from "@/lib/supabase/server";

export type PrescriptionItem = {
  id: string;
  medication: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
};

export type EncounterPrescription = {
  prescriptionId: string | null;
  notes: string | null;
  issuedAt: string | null;
  items: PrescriptionItem[];
};

export async function getEncounterPrescription(
  encounterId: string,
): Promise<EncounterPrescription> {
  const supabase = await createClient();
  const { data: prescription } = await supabase
    .from("prescriptions")
    .select("id, notes, issued_at")
    .eq("encounter_id", encounterId)
    .maybeSingle();

  if (!prescription) {
    return { prescriptionId: null, notes: null, issuedAt: null, items: [] };
  }

  const { data: items } = await supabase
    .from("prescription_items")
    .select("id, medication, dosage, frequency, duration, instructions")
    .eq("prescription_id", prescription.id)
    .order("medication");

  return {
    prescriptionId: prescription.id,
    notes: prescription.notes ?? null,
    issuedAt: prescription.issued_at ?? null,
    items: (items ?? []) as PrescriptionItem[],
  };
}
