export type PaymentSummaryEntry = {
  id?: string;
  status?: string | null;
  amount?: string | number | { toString(): string } | null;
  createdAt?: Date | string | null;
};

export function summarizeFlatPayment(payments: PaymentSummaryEntry[]) {
  const sortedPayments = [...payments].sort((left, right) => {
    const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightTime - leftTime;
  });

  const paidPayment = sortedPayments.find((payment) => payment.status === "PAID") ?? null;

  return {
    hasPaid: Boolean(paidPayment),
    payment: paidPayment ?? sortedPayments[0] ?? null,
  };
}
