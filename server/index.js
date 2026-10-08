import express from "express";
import cors from "cors";
import { saleSchema } from "./validation.js";
import {
  enrichSale,
  solvePrice,
  solveMaximumBuyForReturn,
} from "./calculators/engine.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20kb" }));

const USER_FACING_ERROR_PATTERNS = [
  /Enter /i,
  /Choose /i,
  /This profit target cannot be reached/i,
  /The target return cannot be achieved/i,
  /The expected selling price must be greater than/i,
  /We don't have /i,
  /This broker's /i,
  /This broker's demat /i,
  /This price calculation is not supported/i,
];

const userFacingMessage = (error) => {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  if (message && USER_FACING_ERROR_PATTERNS.some((pattern) => pattern.test(message))) {
    return message;
  }
  return "We couldn't complete the calculation right now. Please check your entries and try again.";
};

const respond = (res, fn) => {
  try {
    return res.json({ success: true, data: fn() });
  } catch (error) {
    return res.status(422).json({
      success: false,
      error: {
        code: "CALCULATION_UNAVAILABLE",
        message: userFacingMessage(error),
      },
    });
  }
};
const parse = (body, res) => {
  const parsed = saleSchema.safeParse(body);
  if (!parsed.success) {
    res
      .status(400)
      .json({
        success: false,
        error: {
          code: "INVALID_REQUEST",
          message: parsed.error.issues[0].message,
          fields: parsed.error.flatten().fieldErrors,
        },
      });
    return null;
  }
  return parsed.data;
};
app.get("/api/health", (_req, res) =>
  res.json({ success: true, data: { status: "ok" } }),
);
app.post("/api/calculations/sale", (req, res) => {
  const data = parse(req.body, res);
  if (data) respond(res, () => enrichSale(data));
});
app.post("/api/calculations/target-profit", (req, res) => {
  const data = parse(req.body, res);
  if (!data) return;
  const target =
    req.body.targetType === "amount"
      ? req.body.targetValue
      : String(
          (Number(req.body.targetValue) / 100) *
            Number(data.buyPrice) *
            (data.holdingType === "mixed"
              ? data.shortQuantity + data.longQuantity
              : data.quantity),
        );
  respond(res, () => solvePrice(data, target, "sell"));
});
app.post("/api/calculations/maximum-buy-price", (req, res) => {
  const data = parse(req.body, res);
  if (!data) return;
  respond(res, () =>
    solveMaximumBuyForReturn(data, Number(req.body.targetPercent)),
  );
});
app.use((_req, res) =>
  res
    .status(404)
    .json({
      success: false,
      error: { code: "NOT_FOUND", message: "Endpoint not found." },
    }),
);
app.listen(process.env.PORT || 3001, () =>
  console.log("Calculation API listening on 3001"),
);
