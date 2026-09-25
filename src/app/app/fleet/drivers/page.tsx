import Link from "next/link";

import { DriverForm } from "@/components/driver-form";
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
import { formatDate } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import { deleteDriver, setDriverActive } from "@/modules/fleet/actions";
import { listDrivers } from "@/modules/fleet/queries";

export const dynamic = "force-dynamic";

export default async function FleetDriversPage() {
  const session = await requireSession();
  const drivers = await listDrivers(session.activeTenantId);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/fleet" className="text-sm text-muted-foreground hover:underline">
          ← Frota
        </Link>
      </div>
      <PageHeader
        eyebrow="Frota"
        title="Motoristas"
        description={`${drivers.length} motorista(s).`}
      />

      <DriverForm />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNH</TableHead>
              <TableHead>Validade da CNH</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-44 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nenhum motorista.
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((driver) => {
                const expired = driver.cnh_expires_at && driver.cnh_expires_at < today;
                return (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.full_name}</TableCell>
                    <TableCell>
                      {driver.cnh_number ?? "—"}
                      {driver.cnh_category ? ` (${driver.cnh_category})` : ""}
                    </TableCell>
                    <TableCell className={expired ? "text-destructive" : ""}>
                      {formatDate(driver.cnh_expires_at)}
                    </TableCell>
                    <TableCell>{driver.phone ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={driver.active ? "success" : "destructive"}>
                        {driver.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-1">
                      <form action={setDriverActive}>
                        <input type="hidden" name="id" value={driver.id} />
                        <input type="hidden" name="active" value={driver.active ? "false" : "true"} />
                        <Button type="submit" variant="ghost" size="sm">
                          {driver.active ? "Desativar" : "Ativar"}
                        </Button>
                      </form>
                      <form action={deleteDriver}>
                        <input type="hidden" name="id" value={driver.id} />
                        <Button type="submit" variant="ghost" size="sm">
                          Excluir
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
