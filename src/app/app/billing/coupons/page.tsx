import { redirect } from "next/navigation";

import { CouponForm } from "@/components/coupon-form";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents, formatDate } from "@/lib/format";
import { deleteCoupon } from "@/modules/billing/actions";
import { listCoupons } from "@/modules/billing/queries";
import {
  COUPON_DISCOUNT_TYPE_LABELS,
  type CouponDiscountType,
} from "@/modules/billing/schema";
import { requireSession } from "@/modules/core/session";

export const dynamic = "force-dynamic";

function valueLabel(type: string, value: number) {
  return type === "percent" ? `${value}%` : formatCents(value);
}

export default async function CouponsPage() {
  const session = await requireSession();
  if (!session.isSuperadmin) redirect("/app");

  const coupons = await listCoupons();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plataforma"
        title="Cupons de desconto"
        description={`${coupons.length} cupom(ns).`}
      />

      <CouponForm />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Desconto</TableHead>
              <TableHead>Válido até</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum cupom.
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell className="font-medium">{coupon.code}</TableCell>
                  <TableCell>
                    {valueLabel(coupon.discount_type, coupon.discount_value)}
                    <span className="block text-xs text-muted-foreground">
                      {COUPON_DISCOUNT_TYPE_LABELS[coupon.discount_type as CouponDiscountType] ??
                        coupon.discount_type}
                    </span>
                  </TableCell>
                  <TableCell>{coupon.valid_until ? formatDate(coupon.valid_until) : "—"}</TableCell>
                  <TableCell>
                    {coupon.used_count}
                    {coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
                  </TableCell>
                  <TableCell>
                    <Badge variant={coupon.active ? "success" : "outline"}>
                      {coupon.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={deleteCoupon}>
                      <input type="hidden" name="id" value={coupon.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        Excluir
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
