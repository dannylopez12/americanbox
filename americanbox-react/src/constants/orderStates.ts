// src/constants/orderStates.ts

export type OrderStateOption = {
  value: string;
  label: string;
  tone?: "sky" | "amber" | "emerald" | "violet" | "slate" | "rose";
};

/**
 * Lista de estados que ya existen en el front (Cliente) para mantener consistencia.
 * Estados limpios sin texto después de comas o guiones según requerimientos de la reunión.
 */
export const ORDER_STATE_OPTIONS: OrderStateOption[] = [
  { value: "prealerta", label: "Pre alerta", tone: "sky" },
  { value: "captado", label: "Captado en agencia", tone: "violet" },
  { value: "viajando", label: "Despachado", tone: "amber" },
  { value: "aduana", label: "En aduana", tone: "rose" },
  { value: "esperaPago", label: "En espera de pago", tone: "slate" },
  { value: "pagoOk", label: "Pago aprobado", tone: "emerald" },
  { value: "entregado", label: "Entregado", tone: "emerald" },
];

export function getOrderStateLabel(value: string): string {
  return ORDER_STATE_OPTIONS.find((opt) => opt.value === value)?.label ?? value;
}

