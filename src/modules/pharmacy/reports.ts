import { createClient } from "@/lib/supabase/server";

export type ReportRange = { start: string; end: string };

export type ValuationRow = {
  id: string;
  name: string;
  quantity: number;
  costCents: number;
  saleCents: number;
};

export type ConsumptionRow = {
  id: string;
  name: string;
  quantity: number;
  costCents: number;
};

export type AbcRow = {
  name: string;
  costCents: number;
  share: number;
  cumulative: number;
  abcClass: "A" | "B" | "C";
};

export type SupplierPurchaseRow = { name: string; totalCents: number };

export type StockReport = {
  stockCostCents: number;
  stockSaleCents: number;
  consumptionQty: number;
  consumptionCostCents: number;
  purchaseCents: number;
  valuation: ValuationRow[];
  consumption: ConsumptionRow[];
  abc: AbcRow[];
  purchasesBySupplier: SupplierPurchaseRow[];
};

const FAIL_SAFE: StockReport = {
  stockCostCents: 0,
  stockSaleCents: 0,
  consumptionQty: 0,
  consumptionCostCents: 0,
  purchaseCents: 0,
  valuation: [],
  consumption: [],
  abc: [],
  purchasesBySupplier: [],
};

export async function getStockReport(
  tenantId: string | null,
  range: ReportRange,
): Promise<StockReport> {
  if (!tenantId) return FAIL_SAFE;

  const startIso = new Date(`${range.start}T00:00`).toISOString();
  const endExclusive = new Date(`${range.end}T00:00`);
  endExclusive.setDate(endExclusive.getDate() + 1);
  const endIso = endExclusive.toISOString();

  const supabase = await createClient();

  const [medicines, batches, movements, orders] = await Promise.all([
    supabase
      .from("medicines")
      .select("id, name, purchase_price_cents, sale_price_cents")
      .eq("tenant_id", tenantId),
    supabase
      .from("medicine_batches")
      .select("medicine_id, quantity, unit_cost_cents")
      .eq("tenant_id", tenantId),
    supabase
      .from("stock_movements")
      .select("medicine_id, movement_type, quantity, created_at")
      .eq("tenant_id", tenantId)
      .in("movement_type", ["out", "expired", "damaged", "return", "adjustment"])
      .gte("created_at", startIso)
      .lt("created_at", endIso),
    supabase
      .from("purchase_orders")
      .select("total_cents, supplier:suppliers(name)")
      .eq("tenant_id", tenantId)
      .eq("status", "received")
      .gte("order_date", range.start)
      .lte("order_date", range.end),
  ]);

  const medicineById = new Map(
    (medicines.data ?? []).map((medicine) => [medicine.id, medicine]),
  );

  // Valoração de estoque
  const stockByMedicine = new Map<string, { quantity: number; costCents: number }>();
  for (const batch of batches.data ?? []) {
    const current = stockByMedicine.get(batch.medicine_id) ?? { quantity: 0, costCents: 0 };
    current.quantity += batch.quantity ?? 0;
    current.costCents += (batch.quantity ?? 0) * (batch.unit_cost_cents ?? 0);
    stockByMedicine.set(batch.medicine_id, current);
  }

  const valuation: ValuationRow[] = [];
  let stockCostCents = 0;
  let stockSaleCents = 0;
  for (const [medicineId, value] of stockByMedicine.entries()) {
    const medicine = medicineById.get(medicineId);
    if (!medicine || value.quantity <= 0) continue;
    const saleCents = value.quantity * (medicine.sale_price_cents ?? 0);
    stockCostCents += value.costCents;
    stockSaleCents += saleCents;
    valuation.push({
      id: medicineId,
      name: medicine.name,
      quantity: value.quantity,
      costCents: value.costCents,
      saleCents,
    });
  }
  valuation.sort((a, b) => b.costCents - a.costCents);

  // Consumo no período
  const consumptionByMedicine = new Map<string, number>();
  let consumptionQty = 0;
  for (const movement of movements.data ?? []) {
    consumptionByMedicine.set(
      movement.medicine_id,
      (consumptionByMedicine.get(movement.medicine_id) ?? 0) + (movement.quantity ?? 0),
    );
    consumptionQty += movement.quantity ?? 0;
  }

  const consumption: ConsumptionRow[] = [];
  let consumptionCostCents = 0;
  for (const [medicineId, quantity] of consumptionByMedicine.entries()) {
    const medicine = medicineById.get(medicineId);
    const costCents = quantity * (medicine?.purchase_price_cents ?? 0);
    consumptionCostCents += costCents;
    consumption.push({
      id: medicineId,
      name: medicine?.name ?? "—",
      quantity,
      costCents,
    });
  }
  consumption.sort((a, b) => b.costCents - a.costCents);

  // Curva ABC (por valor de consumo)
  const abcTotal = consumption.reduce((sum, row) => sum + row.costCents, 0);
  let cumulative = 0;
  const abc: AbcRow[] = consumption.map((row) => {
    const share = abcTotal > 0 ? row.costCents / abcTotal : 0;
    cumulative += share;
    const abcClass: AbcRow["abcClass"] =
      cumulative <= 0.8 ? "A" : cumulative <= 0.95 ? "B" : "C";
    return {
      name: row.name,
      costCents: row.costCents,
      share,
      cumulative,
      abcClass,
    };
  });

  // Compras por fornecedor
  const supplierMap = new Map<string, number>();
  let purchaseCents = 0;
  for (const order of orders.data ?? []) {
    const supplier = Array.isArray(order.supplier) ? order.supplier[0] : order.supplier;
    const name = supplier?.name ?? "Sem fornecedor";
    supplierMap.set(name, (supplierMap.get(name) ?? 0) + (order.total_cents ?? 0));
    purchaseCents += order.total_cents ?? 0;
  }
  const purchasesBySupplier: SupplierPurchaseRow[] = [...supplierMap.entries()]
    .map(([name, totalCents]) => ({ name, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents);

  return {
    stockCostCents,
    stockSaleCents,
    consumptionQty,
    consumptionCostCents,
    purchaseCents,
    valuation,
    consumption,
    abc,
    purchasesBySupplier,
  };
}
