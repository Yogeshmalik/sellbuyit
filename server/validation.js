import { z } from "zod";

const positiveMoney = z
  .string()
  .regex(/^\d+(\.\d{1,4})?$/)
  .refine((v) => Number(v) > 0);
const whole = z.coerce.number().int().positive();
const optionalMoney = z.preprocess(
  (value) => (value === "" || value == null ? undefined : value),
  z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .optional(),
);
export const saleSchema = z
  .object({
    broker: z.enum(["zerodha", "groww", "upstox", "angelone"]),
    exchange: z.enum(["NSE", "BSE"]),
    bseGroup: z.string().optional().default("A"),
    holdingType: z.enum(["short", "long", "mixed"]),
    quantity: whole.optional(),
    shortQuantity: whole.optional(),
    longQuantity: whole.optional(),
    buyPrice: positiveMoney,
    sellPrice: positiveMoney,
    transactionDate: z.string().date(),
    dpCategory: z.enum(["male", "female"]),
    buyOrders: whole.default(1),
    sellOrders: whole.default(1),
    ltcgUsed: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/)
      .default("0"),
    annualTaxableIncome: optionalMoney,
  })
  .superRefine((data, ctx) => {
    if (
      data.holdingType === "mixed" &&
      (!data.shortQuantity || !data.longQuantity)
    )
      ctx.addIssue({
        code: "custom",
        message: "Enter both short-term and long-term quantities.",
        path: ["shortQuantity"],
      });
    if (data.holdingType !== "mixed" && !data.quantity)
      ctx.addIssue({
        code: "custom",
        message: "Quantity must be a positive integer.",
        path: ["quantity"],
      });
    if (data.exchange === "BSE" && !data.bseGroup)
      ctx.addIssue({
        code: "custom",
        message: "Select a BSE scrip group.",
        path: ["bseGroup"],
      });
  });
