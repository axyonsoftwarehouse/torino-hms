-- =============================================================================
-- Torino HMS — Financeiro: índices de apoio
-- (tabelas services/invoices/invoice_items/payments/expenses já criadas no núcleo)
-- =============================================================================

create index if not exists invoice_items_invoice_idx on public.invoice_items (invoice_id);
create index if not exists payments_invoice_idx      on public.payments (invoice_id);
create index if not exists invoices_patient_idx      on public.invoices (patient_id);
create index if not exists expenses_category_idx     on public.expenses (category_id);
