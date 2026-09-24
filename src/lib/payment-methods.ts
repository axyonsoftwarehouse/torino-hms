export const PAYMENT_METHODS = [
  "cash",
  "pix",
  "credit_card",
  "debit_card",
  "transfer",
  "insurance",
  "other",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  transfer: "Transferência",
  insurance: "Convênio",
  other: "Outro",
};
