import { createClient } from "@/lib/supabase/server";

type Named = { name: string };

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export type MedicineCategoryItem = { id: string; name: string; description: string | null };

export type SupplierItem = {
  id: string;
  name: string;
  company_name: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  tax_number: string | null;
};

export type MedicineListItem = {
  id: string;
  name: string;
  generic_name: string | null;
  category_name: string | null;
  unit: string | null;
  purchase_price_cents: number;
  sale_price_cents: number;
  reorder_level: number;
  active: boolean;
  stock: number;
};

export type BatchItem = {
  id: string;
  batch_number: string;
  expiry_date: string | null;
  quantity: number;
  unit_cost_cents: number;
};

export type MovementItem = {
  id: string;
  movement_type: string;
  quantity: number;
  reference: string | null;
  notes: string | null;
  created_at: string;
};

export type MedicineDetail = MedicineListItem & {
  manufacturer: string | null;
  notes: string | null;
  category_id: string | null;
  batches: BatchItem[];
  movements: MovementItem[];
};

export async function listMedicineCategories(
  tenantId: string | null,
): Promise<MedicineCategoryItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medicine_categories")
    .select("id, name, description")
    .eq("tenant_id", tenantId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as MedicineCategoryItem[];
}

export async function listSuppliers(tenantId: string | null): Promise<SupplierItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, name, company_name, contact_person, email, phone, tax_number")
    .eq("tenant_id", tenantId)
    .order("name");
  if (error) throw error;
  return (data ?? []) as SupplierItem[];
}

export async function listMedicines(
  tenantId: string | null,
): Promise<MedicineListItem[]> {
  if (!tenantId) return [];
  const supabase = await createClient();

  const [{ data: medicines }, { data: batches }] = await Promise.all([
    supabase
      .from("medicines")
      .select(
        "id, name, generic_name, unit, purchase_price_cents, sale_price_cents, reorder_level, active, category:medicine_categories(name)",
      )
      .eq("tenant_id", tenantId)
      .order("name"),
    supabase
      .from("medicine_batches")
      .select("medicine_id, quantity")
      .eq("tenant_id", tenantId),
  ]);

  const stockByMedicine = new Map<string, number>();
  for (const batch of batches ?? []) {
    stockByMedicine.set(
      batch.medicine_id,
      (stockByMedicine.get(batch.medicine_id) ?? 0) + (batch.quantity ?? 0),
    );
  }

  type Row = Omit<MedicineListItem, "category_name" | "stock"> & {
    category: Named | Named[] | null;
  };

  return (medicines ?? []).map((row) => {
    const r = row as Row;
    return {
      id: r.id,
      name: r.name,
      generic_name: r.generic_name,
      unit: r.unit,
      purchase_price_cents: r.purchase_price_cents,
      sale_price_cents: r.sale_price_cents,
      reorder_level: r.reorder_level,
      active: r.active,
      category_name: first(r.category)?.name ?? null,
      stock: stockByMedicine.get(r.id) ?? 0,
    };
  });
}

export async function getMedicine(
  id: string,
): Promise<MedicineDetail | null> {
  const supabase = await createClient();
  const { data: medicine } = await supabase
    .from("medicines")
    .select(
      "id, name, generic_name, unit, purchase_price_cents, sale_price_cents, reorder_level, active, manufacturer, notes, category_id, category:medicine_categories(name)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!medicine) return null;

  const [{ data: batches }, { data: movements }] = await Promise.all([
    supabase
      .from("medicine_batches")
      .select("id, batch_number, expiry_date, quantity, unit_cost_cents")
      .eq("medicine_id", id)
      .order("expiry_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("stock_movements")
      .select("id, movement_type, quantity, reference, notes, created_at")
      .eq("medicine_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const batchRows = (batches ?? []) as BatchItem[];
  const row = medicine as Omit<MedicineDetail, "batches" | "movements" | "category_name" | "stock"> & {
    category: Named | Named[] | null;
  };

  return {
    id: row.id,
    name: row.name,
    generic_name: row.generic_name,
    unit: row.unit,
    purchase_price_cents: row.purchase_price_cents,
    sale_price_cents: row.sale_price_cents,
    reorder_level: row.reorder_level,
    active: row.active,
    manufacturer: row.manufacturer,
    notes: row.notes,
    category_id: row.category_id,
    category_name: first(row.category)?.name ?? null,
    stock: batchRows.reduce((sum, batch) => sum + batch.quantity, 0),
    batches: batchRows,
    movements: (movements ?? []) as MovementItem[],
  };
}

export type ExpiringBatch = {
  id: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  medicine_name: string | null;
};

export async function listExpiringBatches(
  tenantId: string | null,
  days = 60,
): Promise<ExpiringBatch[]> {
  if (!tenantId) return [];

  const limit = new Date();
  limit.setDate(limit.getDate() + days);
  const limitStr = limit.toISOString().slice(0, 10);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("medicine_batches")
    .select("id, batch_number, expiry_date, quantity, medicine:medicines(name)")
    .eq("tenant_id", tenantId)
    .gt("quantity", 0)
    .not("expiry_date", "is", null)
    .lte("expiry_date", limitStr)
    .order("expiry_date");

  if (error) throw error;

  type Row = {
    id: string;
    batch_number: string;
    expiry_date: string;
    quantity: number;
    medicine: Named | Named[] | null;
  };

  return (data ?? []).map((row) => {
    const r = row as Row;
    return {
      id: r.id,
      batch_number: r.batch_number,
      expiry_date: r.expiry_date,
      quantity: r.quantity,
      medicine_name: first(r.medicine)?.name ?? null,
    };
  });
}
