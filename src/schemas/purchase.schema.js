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

const razorpayVerifySchema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
  amountPaid: z.number().optional(),
  couponCode: z.string().optional(),
});

export { purchaseSchema, razorpayVerifySchema };
