import { ServiceForm } from "@/components/service-form";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCents } from "@/lib/format";
import { requireSession } from "@/modules/core/session";
import { deleteService } from "@/modules/services/actions";
import { listServices } from "@/modules/services/queries";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const session = await requireSession();
  const services = await listServices(session.activeTenantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Serviços</h1>
        <p className="text-sm text-muted-foreground">
          {services.length} serviço(s) no catálogo.
        </p>
      </div>

      <ServiceForm />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  Nenhum serviço cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              services.map((service) => (
                <TableRow key={service.id}>
                  <TableCell className="font-medium">{service.name}</TableCell>
                  <TableCell>{service.category ?? "—"}</TableCell>
                  <TableCell>{formatCents(service.price_cents)}</TableCell>
                  <TableCell className="text-right">
                    <form action={deleteService}>
                      <input type="hidden" name="id" value={service.id} />
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
