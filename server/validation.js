import { z } from "zod";

const positiveMoney = (label) =>
  z
    .string({ error: `Enter ${label}.` })
    .regex(/^\d+(\.\d{1,4})?$/, {
      error: `Enter a valid ${label} using numbers only.`,
    })
    .refine((value) => Number(value) > 0, {
      error: `Enter a ${label} greater than zero.`,
    });

const nonNegativeMoney = (label, decimals = 2) =>
  z
    .string({ error: `Enter ${label}.` })
    .regex(new RegExp(`^\\d+(\\.\\d{1,${decimals}})?$`), {
      error: `Enter a valid ${label} using numbers only.`,
    })
    .refine((value) => Number(value) >= 0, {
      error: `${label[0].toUpperCase()}${label.slice(1)} cannot be negative.`,
    });

const optionalMoney = (label) =>
  z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, {
        error: `Enter a valid ${label} using numbers only.`,
      })
      .optional(),
  );

const whole = z.coerce
  .number({ error: "Enter a whole number." })
  .int({
    error: "Enter a whole number.",
  })
  .positive({ error: "Enter a number greater than zero." });

const bseGroups = [
  "standard375",
  "standard275",
  "special10000",
  "special100000",
  "A",
  "B",
  "E",
  "F",
  "FC",
  "G",
  "GC",
  "W",
  "T",
  "NS",
  "NT",
  "M",
  "MT",
  "TS",
  "MS",
  "X",
  "XC",
  "XD",
  "XT",
  "Z",
  "ZP",
  "P",
  "SS",
  "ST",
];

export const saleSchema = z
  .object({
    broker: z.enum(["zerodha", "groww", "upstox", "angelone"], {
      error: "Choose a supported broker.",
    }),
    exchange: z.enum(["NSE", "BSE"], {
      error: "Choose NSE or BSE.",
    }),
    bseGroup: z
      .string()
      .optional()
      .refine((value) => value == null || bseGroups.includes(value), {
        error: "Choose a supported BSE fee category.",
      }),
    holdingType: z.enum(["short", "long", "mixed"], {
      error: "Choose a holding type.",
    }),
    quantity: whole.optional(),
    shortQuantity: whole.optional(),
    longQuantity: whole.optional(),
    buyPrice: positiveMoney("your average buy price").optional(),
    sellPrice: positiveMoney("the selling price").optional(),
    transactionDate: z.string({ error: "Choose the transaction date." }).date({
      error: "Choose a valid transaction date.",
    }),
    dpCategory: z.enum(["male", "female"], {
      error: "Choose the DP tariff category.",
    }),
    buyOrders: whole.default(1),
    sellOrders: whole.default(1),
    ltcgUsed: nonNegativeMoney("the LTCG exemption already used").default("0"),
    annualTaxableIncome: optionalMoney(
      "annual taxable income before this sale",
    ),
    targetType: z
      .enum(["percentage", "amount"], {
        error: "Choose a target type.",
      })
      .optional(),
    targetValue: positiveMoney("the target profit").optional(),
    targetPercent: positiveMoney("the target net profit percentage").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.holdingType === "mixed") {
      if (!data.shortQuantity) {
        ctx.addIssue({
          code: "custom",
          message: "Enter the number of short-term shares.",
          path: ["shortQuantity"],
        });
      }
      if (!data.longQuantity) {
        ctx.addIssue({
          code: "custom",
          message: "Enter the number of long-term shares.",
          path: ["longQuantity"],
        });
      }
    } else if (!data.quantity) {
      ctx.addIssue({
        code: "custom",
        message: "Enter the number of shares.",
        path: ["quantity"],
      });
    }

    if (data.exchange === "BSE" && !data.bseGroup) {
      ctx.addIssue({
        code: "custom",
        message: "Choose the BSE fee category that applies to your stock.",
        path: ["bseGroup"],
      });
    }

    if (data.targetType && !data.targetValue) {
      ctx.addIssue({
        code: "custom",
        message: "Enter the profit target.",
        path: ["targetValue"],
      });
    }
    if (!data.targetType && data.targetValue) {
      ctx.addIssue({
        code: "custom",
        message:
          "Choose whether your target is a percentage or a rupee amount.",
        path: ["targetType"],
      });
    }

    const ltcgUsed = Number(data.ltcgUsed || 0);
    if (ltcgUsed > 125000) {
      ctx.addIssue({
        code: "custom",
        message: "LTCG exemption already used cannot be more than ₹1,25,000.",
        path: ["ltcgUsed"],
      });
    }
  });
