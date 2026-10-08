import { describe, expect, it } from "vitest";
import {
  enrichSale,
  solvePrice,
  solveMaximumBuyForReturn,
} from "../../server/calculators/engine.js";

const base = {
  broker: "zerodha",
  exchange: "NSE",
  bseGroup: "A",
  holdingType: "short",
  quantity: 97,
  buyPrice: "281.80",
  sellPrice: "290",
  transactionDate: "2026-10-08",
  dpCategory: "male",
  buyOrders: 1,
  sellOrders: 1,
  ltcgUsed: "0",
};
describe("delivery calculation engine", () => {
  it("calculates the required Zerodha fixture without binary floating point artifacts", () => {
    const result = enrichSale(base);
    expect(result.values.buyValue).toBe("27334.60");
    expect(Number(result.charges.total)).toBeGreaterThan(0);
    expect(
      result.charges.items.find((x) => x.name === "DP charges").amount,
    ).toBe("13.00");
  });
  it.each([1, 10, 100, 1000])("supports %i shares", (quantity) => {
    expect(enrichSale({ ...base, quantity }).result.netProfit).toMatch(
      /^-?\d+\.\d{2}$/,
    );
  });
  it("keeps short and long-term gains separate", () => {
    const result = enrichSale({
      ...base,
      holdingType: "mixed",
      shortQuantity: 40,
      longQuantity: 60,
    });
    expect(result.tax.groups).toHaveLength(2);
    expect(result.tax.stcgTax).not.toBe("0.00");
    expect(Number(result.tax.ltcgExemption)).toBeGreaterThanOrEqual(0);
  });
  it("returns a target price satisfying the requested net profit", () => {
    const target = solvePrice(base, "500", "sell");
    expect(Number(target.calculation.result.netProfit)).toBeGreaterThanOrEqual(
      500,
    );
  });
  it("returns a maximum buy price that satisfies a 5% net return", () => {
    const target = solveMaximumBuyForReturn(base, 5);
    expect(
      Number(target.calculation.result.returnPercentage),
    ).toBeGreaterThanOrEqual(5);
  });
});
