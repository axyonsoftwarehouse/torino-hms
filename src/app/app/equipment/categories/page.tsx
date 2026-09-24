import { EquipmentCategoryForm } from "@/components/equipment-category-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireSession } from "@/modules/core/session";
import { deleteEquipmentCategory } from "@/modules/equipment/actions";
import { listEquipmentCategories } from "@/modules/equipment/queries";

export const dynamic = "force-dynamic";

export default async function EquipmentCategoriesPage() {
  const session = await requireSession();
  const categories = await listEquipmentCategories(session.activeTenantId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Engenharia Clínica"
        title="Categorias de equipamento"
        description={`${categories.length} categoria(s).`}
      />

      <EquipmentCategoryForm />

      <div className="rounded-xl border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  Nenhuma categoria.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.description ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <form action={deleteEquipmentCategory}>
                      <input type="hidden" name="id" value={category.id} />
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
