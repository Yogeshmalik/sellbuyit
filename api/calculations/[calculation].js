import { saleSchema } from "../../server/validation.js";
import {
  enrichSale,
  solvePrice,
  solveMaximumBuyForReturn,
} from "../../server/calculators/engine.js";

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
  const message =
    typeof error?.message === "string" ? error.message.trim() : "";
  if (
    message &&
    USER_FACING_ERROR_PATTERNS.some((pattern) => pattern.test(message))
  ) {
    return message;
  }
  return "We couldn't complete the calculation right now. Please check your entries and try again.";
};

const sendJson = (res, status, payload) => res.status(status).json(payload);

const parse = (body, res) => {
  const parsed = saleSchema.safeParse(body ?? {});
  if (!parsed.success) {
    sendJson(res, 400, {
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

const respond = (res, fn) => {
  try {
    sendJson(res, 200, { success: true, data: fn() });
  } catch (error) {
    sendJson(res, 422, {
      success: false,
      error: {
        code: "CALCULATION_UNAVAILABLE",
        message: userFacingMessage(error),
      },
    });
  }
};

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, {
      success: false,
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "This action is not available for this request.",
      },
    });
  }

  const calculation = Array.isArray(req.query?.calculation)
    ? req.query.calculation[0]
    : req.query?.calculation;
  const data = parse(req.body, res);
  if (!data) return undefined;

  if (calculation === "sale") {
    return respond(res, () => enrichSale(data));
  }

  if (calculation === "target-profit") {
    if (req.body?.targetType === "amount") {
      return respond(res, () => solvePrice(data, req.body.targetValue, "sell"));
    }

    if (req.body?.targetType === "percentage") {
      const target = String(
        (Number(req.body.targetValue) / 100) *
          Number(data.buyPrice) *
          (data.holdingType === "mixed"
            ? data.shortQuantity + data.longQuantity
            : data.quantity),
      );
      return respond(res, () => solvePrice(data, target, "sell"));
    }

    return sendJson(res, 400, {
      success: false,
      error: {
        code: "INVALID_REQUEST",
        message:
          "Choose whether your target is a percentage or a rupee amount.",
        fields: {
          targetType: [
            "Choose whether your target is a percentage or a rupee amount.",
          ],
        },
      },
    });
  }

  if (calculation === "maximum-buy-price") {
    return respond(res, () =>
      solveMaximumBuyForReturn(data, Number(req.body?.targetPercent)),
    );
  }

  return sendJson(res, 404, {
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested calculator service was not found.",
    },
  });
}
