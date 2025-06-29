import { z } from "zod/v4";

const purchaseSchema = z.object({
  amountBreakdown: z.object({
    netDiscount: z.number().nonnegative(),
    couponUsed: z.string(),
    totalAmountPaid: z.number(),
  }),
  paymentStatus: z.string(),
  paymentMethod: z.string(),
  transactionId: z.string(),
});

export { purchaseSchema };
